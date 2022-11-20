import { Contract, providers, utils, BigNumber } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
} from "../constants";

/**
 * removeLiquidity: 从流动性中移除LP代币的 removeLPTokensWei 数量，以及 ether 和 ZD618 代币的计算数量
 */
export const removeLiquidity = async (signer, removeLPTokensWei) => {
    // 创建 exchange 合约
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tx = await exchangeContract.removeLiquidity(removeLPTokensWei);
    await tx.wait();
};

/**
 * getTokensAfterRemove: 计算用户从合约中删除LP令牌的 removeLPTokenWei 数量
 * 后将返回给用户的 Eth 和 CD 代币数量
 */
export const getTokensAfterRemove = async (
    provider,
    removeLPTokenWei,
    _ethBalance,
    zeroDot618TokenReserve
) => {
    try {
        // 创建 exchange 合约
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        // 获取总的 ZD618 代币供应量
        const _totalSupply = await exchangeContract.totalSupply();
        // 这里我们使用 BigNumber 的乘法和除法方法
        // 用户退出LP代币后，将发送回给用户的Eth数量基于一个比率计算,
        // 比率是 -> (amount of Eth that would be sent back to the user / Eth reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
        // 通过一些数学计算，我们得到 -> (amount of Eth that would be sent back to the user) = (Eth Reserve * LP tokens withdrawn) / (total supply of LP tokens)
        // 同样地，我们也为 ZD618 代币保持一个比率，所以在我们的例子中
        // 比率是 -> (amount of ZD618 tokens sent back to the user / ZD618 Token reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
        // 得到 (amount of ZD618 tokens sent back to the user) = (ZD618 token reserve * LP tokens withdrawn) / (total supply of LP tokens)
        const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
        const _removeZD618 = zeroDot618TokenReserve
            .mul(removeLPTokenWei)
            .div(_totalSupply);
        return {
            _removeEther,
            _removeZD618,
        };
    } catch (err) {
        console.error(err);
    }
};