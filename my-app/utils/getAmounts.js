import { Contract } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * getEtherBalance:检索用户或合约的eth余额
 */
export const getEtherBalance = async (provider, address, contract = false) => {
    try {
        // 如果调用者将 contract 设置为true，
        // 则检索 exchange contract 中的ether余额，
        // 如果设置为false，则检索用户地址的ether余额
        if (contract) {
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            return balance;
        } else {
            const balance = await provider.getBalance(address);
            return balance;
        }
    } catch (err) {
        console.error(err);
        return 0;
    }
};

/**
 * getZD618TokensBalance: 获取指定地址的ZD618代币余额
 */
export const getZD618TokensBalance = async (provider, address) => {
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
        );
        const balanceOfZeroDot618Tokens = await tokenContract.balanceOf(address);
        return balanceOfZeroDot618Tokens;
    } catch (err) {
        console.error(err);
    }
};

/**
 * getLPTokensBalance: 获取指定地址的ZD618 LP代币余额
 */
export const getLPTokensBalance = async (provider, address) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const balanceOfLPTokens = await exchangeContract.balanceOf(address);
        return balanceOfLPTokens;
    } catch (err) {
        console.error(err);
    }
};

/**
 * getReserveOfZD618Tokens: 获取合约地址的ZD618代币余额
 */
export const getReserveOfZD618Tokens = async (provider) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const reserve = await exchangeContract.getReserve();
        return reserve;
    } catch (err) {
        console.error(err);
    }
};
