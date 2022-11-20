// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exchange is ERC20 {
    address public zeroDot618TokenAddress;

    // Exchange 继承 ERC20，因为我们的 Exchange 将跟踪ZD618 LP代币的情况
    constructor(address _ZeroDot618Token)
        ERC20("ZeroDot618 LP Token", "ZD618LP")
    {
        require(
            _ZeroDot618Token != address(0),
            "Token address passed is a null address"
        );
        zeroDot618TokenAddress = _ZeroDot618Token;
    }

    /**
     * @dev 获取代币余额
     */
    function getReserve() public view returns (uint256) {
        return ERC20(zeroDot618TokenAddress).balanceOf(address(this));
    }

    /**
     * @dev 添加流动性到交易所
     */
    function addLiquidity(uint256 _amount) public payable returns (uint256) {
        uint256 liquidity;
        uint256 ethBalance = address(this).balance;
        uint256 zeroDot618TokenReserve = getReserve();
        ERC20 zeroDot618Token = ERC20(zeroDot618TokenAddress);

        // 如果储备金是空的，则接收用户提供的任何值，以用于以太币和ZD618代币，因为目前没有任何比例。
        if (zeroDot618TokenReserve == 0) {
            // 将 zeroDot618Token 从用户的账户转移到合同中。
            zeroDot618Token.transferFrom(msg.sender, address(this), _amount);
            // 取出当前的ethBalance并向用户铸造 ethBalance 数量的LP代币。
            // 提供的 liquidity 等于 ethBalance，因为这是用户第一
            // 次向合约添加 eth，所以无论 eth 合约有什么，都等于
            // 用户在当前 addLiquidity 调用 liquidity 代币中提供
            // 的，需要在 addLiquidity 调用中创建给用户的代币应该总是成比例的
            liquidity = ethBalance;
            _mint(msg.sender, liquidity);
        } else {
            /**
             * 如果储备不是空的，则接收用户提供的任何值为
             * 并根据该比例确定需要提供多少ZD618代币
             * 以防止由于额外的流动性而对价格产生巨大影响
             */
            uint256 ethReserve = ethBalance - msg.value;
            uint256 zeroDot618TokenAmount = (msg.value *
                zeroDot618TokenReserve) / (ethReserve);
            require(
                _amount >= zeroDot618TokenAmount,
                "Amount of tokens sent is less than the minimum tokens required"
            );
            zeroDot618Token.transferFrom(
                msg.sender,
                address(this),
                zeroDot618TokenAmount
            );
            liquidity = (totalSupply() * msg.value) / ethReserve;
            _mint(msg.sender, liquidity);
        }
    }

    /**
     * @dev 在swap中返回给用户的Eth/ZD618代币的数量
     */
    function removeLiquidity(uint256 _amount)
        public
        returns (uint256, uint256)
    {
        require(_amount > 0, "_amount should be greater than zero");
        uint256 ethReserve = address(this).balance;
        uint256 _totalSupply = totalSupply();

        uint256 ethAmount = (ethReserve * _amount) / _totalSupply;

        uint256 zeroDot618TokenAmount = (getReserve() * _amount) / _totalSupply;

        _burn(msg.sender, _amount);

        payable(msg.sender).transfer(ethAmount);
        ERC20(zeroDot618TokenAddress).transfer(
            msg.sender,
            zeroDot618TokenAmount
        );
        return (ethAmount, zeroDot618TokenAmount);
    }

    /**
     * @dev 返回将返回给用户的Eth/ZD618代币的数量。
     */
    function getAmountOfTokens(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        uint256 inputAmountWithFee = inputAmount * 99;
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator / denominator;
    }

    /**
     * @dev 将Eth换成ZD618代币
     */
    function ethToZeroDot618Token(uint256 _minTokens) public payable {
        uint256 tokenReserve = getReserve();
        uint256 tokensBought = getAmountOfTokens(
            msg.value,
            address(this).balance - msg.value,
            tokenReserve
        );

        require(tokensBought >= _minTokens, "insufficient output amount");
        ERC20(zeroDot618TokenAddress).transfer(msg.sender, tokensBought);
    }

    /**
     * @dev 将ZD618代币换成Eth
     */
    function zeroDot618TokenToEth(uint256 _tokensSold, uint256 _minEth) public {
        uint256 tokenReserve = getReserve();
        uint256 ethBought = getAmountOfTokens(
            _tokensSold,
            tokenReserve,
            address(this).balance
        );
        require(ethBought >= _minEth, "insufficient output amount");
        ERC20(zeroDot618TokenAddress).transferFrom(
            msg.sender,
            address(this),
            _tokensSold
        );
        payable(msg.sender).transfer(ethBought);
    }
}
