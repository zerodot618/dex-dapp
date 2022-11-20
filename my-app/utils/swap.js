import { Contract } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * getAmountOfTokensReceivedFromSwap: 返回用户交换 _swapAmountWei 数量的Eth/ZD618代币时
 * 可以接收的Eth/ZD618代币的数量。
 */
export const getAmountOfTokensReceivedFromSwap = async (
    _swapAmountWei,
    provider,
    ethSelected,
    ethBalance,
    reservedZD618
) => {
    // 创建 exchange 合约
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );
    let amountOfTokens;
    // 如果 Eth 被选中，这意味着我们的输入值是 Eth，
    // 这意味着我们的输入数量将是 _swapAmountWei，
    // 输入储备将是合约中的 ethBalance，输出储备将是ZD618代币储备
    if (ethSelected) {
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            ethBalance,
            reservedZD618
        );
    } else {
        // 如果 Eth 没有被选中，这意味着我们的输入值是 ZD618 代币，
        // 这意味着我们的输入数量将是 _swapAmountWei，
        // 输入储备将是合同的 ZD618代币储备，输出储备将是 ethBalance
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            reservedZD618,
            ethBalance
        );
    }

    return amountOfTokens;
};

/**
 * swapTokens:将Eth/ZD618代币的 swapAmountWei 与Eth/ZD618代币的 tokenToBeReceivedAfterSwap 数额互换
 */
export const swapTokens = async (
    signer,
    swapAmountWei,
    tokenToBeReceivedAfterSwap,
    ethSelected
) => {
    // 创建 exchange 合约
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
    );
    let tx;
    // 如果Eth被选中，则调用 ethToCryptoDevToken 函数，否则调用合约中的所有 cryptoDevTokenToEth 函数
    // 正如你所看到的，你需要将 swapAmount 为一个值传递给函数，
    // 因为它是我们支付给合约的以太币，而不是传递给函数的一个值
    if (ethSelected) {
        tx = await exchangeContract.ethToCryptoDevToken(
            tokenToBeReceivedAfterSwap,
            {
                value: swapAmountWei,
            }
        );
    } else {
        // 用户必须为合约批准 swapAmountWei，因为ZD618代币是ERC20
        tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            swapAmountWei.toString()
        );
        await tx.wait();
        // 调用 ethToZeroDot618Token 函数，该函数将接受ZD618代币的 swapAmountWei，
        // 并将 tokenToBeReceivedAfterSwap 数量的 Eth 发送回给用户
        tx = await exchangeContract.ethToZeroDot618Token(
            swapAmountWei,
            tokenToBeReceivedAfterSwap
        );
    }
    await tx.wait();
};