import { Contract, utils } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * addLiquidity 为交易所增加流动性,
 * 如果用户正在添加初始流动性，则用户决定他想要添加到交易所的以太币和ZD618代币。
 * 如果他是在初始流动性已经添加之后添加流动性，那么我们计算他可以添加的ZD618代币，
 * 给定他想要添加的Eth，保持比率恒定
 */
export const addLiquidity = async (
    signer,
    addZD618AmountWei,
    addEtherAmountWei
) => {
    try {
        // 创建一个token合约实例
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            signer
        );
        // 创建 exchange 合约实例
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        );
        // ZD618 代币是 ERC20, 用户需要支付合约津贴，
        // 才能从合同中取出所需数量的ZD618代币
        let tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            addZD618AmountWei.toString()
        );
        await tx.wait();
        // 在合约得到批准后，添加以太坊和ZD618代币的流动性。
        tx = await exchangeContract.addLiquidity(addZD618AmountWei, {
            value: addEtherAmountWei,
        });
        await tx.wait();
    } catch (err) {
        console.error(err);
    }
};

/**
 * calculateZD618 计算需要添加到流动性的ZD618代币，给定 _addEtherAmountWei 的以太数量
 */
export const calculateZD618 = async (
    _addEther = "0",
    etherBalanceContract,
    zd618TokenReserve
) => {
    // `_addEther` 是一个字符串，我们需要在进行计算之前将其转换为一个Bignumber。
    // 我们使用`ethers.js`中的`parseEther`函数来做这件事
    const _addEtherAmountWei = utils.parseEther(_addEther);

    // 当我们添加流动性时，需要保持比例。
    // 我们需要让用户知道特定数量的eth有多少ZD618代币
    // 他可以增加，以便对价格影响不大
    // 我们遵循的比例是 (amount of ZD618 tokens to be added) / (ZD618 tokens balance) = (Eth that would be added) / (Eth reserve in the contract)
    // 因此，通过数学计算，我们得到 (amount of ZD618 tokens to be added) = (Eth that would be added * ZD618 tokens balance) / (Eth reserve in the contract)

    const zeroDot618TokenAmount = _addEtherAmountWei
        .mul(zd618TokenReserve)
        .div(etherBalanceContract);
    return zeroDot618TokenAmount;
};