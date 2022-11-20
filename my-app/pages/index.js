import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateZD618 } from "../utils/addLiquidity";
import {
  getZD618TokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfZD618Tokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
  /** 通用状态变量 */
  // 当交易进行挖掘时，loading设置为true，完成后，loading设置为false
  const [loading, setLoading] = useState(false);
  // 我们在这个dapp中有两个选项卡，流动性选项卡和互换选项卡。
  // 这个变量跟踪用户在哪个选项卡上。如果设置为true，
  // 这意味着用户在“liquidity”选项卡上，否则他在“swap”选项卡上
  const [liquidityTab, setLiquidityTab] = useState(true);
  // 定义大数 0
  const zero = BigNumber.from(0);
  /** 追踪数量的状态变量 */
  // `ethBalance` 记录用户账户持有的Eth数量
  const [ethBalance, setEtherBalance] = useState(zero);
  // `reservedZD618` 追踪交易所合约中的 ZD618 代币储备余额
  const [reservedZD618, setReservedZD618] = useState(zero);
  // etherBalanceContract 追踪合约中的eth余额
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  // zD618Balance 是用户账户中的 ZD618 代币的数量
  const [zD618Balance, setZD618Balance] = useState(zero);
  // `lpBalance` 是用户账户中持有的LP代币数量
  const [lpBalance, setLPBalance] = useState(zero);
  /** 跟踪要添加或删除的流动性的变量 */
  // addEther 是指用户希望添加到流动资金中的以太币数量
  const [addEther, setAddEther] = useState(zero);
  // addZD618Tokens 跟踪用户想要添加到流动性中的ZD618 代币的数量，以防没有初始流动性，
  // 在流动性添加后，它跟踪用户可以添加的ZD618 代币，给定一定数量的以太
  const [addZD618Tokens, setAddZD618Tokens] = useState(zero);
  // removeEther 是基于一定数量的 "LP "代币，将被送回给用户的 "Ether "数量
  const [removeEther, setRemoveEther] = useState(zero);
  // removeZD618 是指根据一定数量的 "LP "代币，将送回给用户的ZD618代币的数量
  const [removeZD618, setRemoveZD618] = useState(zero);
  // removeLPTokens 用户希望从流动性中移除的LP代币的数量
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  /** 跟踪互换功能的变量 */
  // swapAmount 用户想要交换的数量
  const [swapAmount, setSwapAmount] = useState("");
  // tokenToBeReceivedAfterSwap 这记录了用户在交换完成后将收到的代币数量
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] =
    useState(zero);
  // 跟踪是否选择了 Eth 或ZD618代币。如果 Eth 被选中，这意味着用户想要用一些Eth交换一些ZD618代币，
  // 反之亦然，如果' Eth '没有被选中
  const [ethSelected, setEthSelected] = useState(true);
  /** 钱包连接 */
  // 创建一个对Web3modal的引用（用于连接到Metamask），只要页面打开就会持续存在。
  const web3ModalRef = useRef();
  // walletConnected 追踪用户的钱包是否已连接
  const [walletConnected, setWalletConnected] = useState(false);

  /**
   * getAmounts调用各种函数来获取ethbalance的金额，LP代币等
   */
  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      // 获取用户账户中的eth数量
      const _ethBalance = await getEtherBalance(provider, address);
      // 获取用户账户中的ZD618代币数量
      const _zD618Balance = await getZD618TokensBalance(provider, address);
      // 获取用户持有的 ZD618 LP代币的数量
      const _lpBalance = await getLPTokensBalance(provider, address);
      // 获得存在于 "交换合约 "储备中的 ZD618 代币的数量
      const _reservedZD618 = await getReserveOfZD618Tokens(provider);
      // 获取合约中的eth储备
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setZD618Balance(_zD618Balance);
      setLPBalance(_lpBalance);
      setReservedZD618(_reservedZD618);
      setReservedZD618(_reservedZD618);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };

  /**** 交换函数 ****/

  /**
   * swapTokens: 将Eth/ZD618代币的 swapAmountWei 与Eth/ZD618代币的 tokenToBeReceivedAfterSwap 数量进行交换
   */
  const _swapTokens = async () => {
    try {
      // 使用`ethers.js`中的`parseEther`库将用户输入的金额转换为大数。
      const swapAmountWei = utils.parseEther(swapAmount);
      // 检查用户是否输入了零
      // 我们在这里使用`eq`方法，来自`ethers.js`中的BigNumber类。
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // 从`utils`文件夹中调用swapTokens函数
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
        // 获得交换后的所有更新金额
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  /**
   * _getAmountOfTokensReceivedFromSwap: 返回用户交换 _swapAmountWEI  数量的Eth/ZD618代币时可以接收的Eth/ZD618代币的数量。
   */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      // 使用`ethers.js`中的`parseEther`库将用户输入的金额转换为大数。
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      // 检查用户是否输入了零
      // 我们在这里使用`eq`方法，来自`ethers.js`中的BigNumber类。
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        // 获取合约中的eth数量
        const _ethBalance = await getEtherBalance(provider, null, true);
        // 从utils文件夹中调用`getAmOfTokensReceivedFromSwap`
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedZD618
        );
        settokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        settokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /*** END ***/

  /**** 添加流动性 ****/

  /**
   * _addLiquidity 添加流动性,
   * 如果用户正在添加初始流动性，用户决定他想要添加到交易所的以太币和ZD618代币。
   * 如果他是在初始流动性已经添加之后添加流动性，
   * 那么我们计算他可以添加的加密开发代币，给定他想要添加的Eth，保持比率恒定
   */
  const _addLiquidity = async () => {
    try {
      const addEtherWei = utils.parseEther(addEther.toString());
      if (!addZD618Tokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // 从utils文件夹中调用addLiquidity函数。
        await addLiquidity(signer, addZD618Tokens, addEtherWei);
        setLoading(false);
        // 重新初始化 ZD618 代币
        setAddZD618Tokens(zero);
        //在加入流动资金后，获得所有流动性的数量
        await getAmounts();
      } else {
        setAddZD618Tokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddZD618Tokens(zero);
    }
  };

  /**** END ****/

  /**** 删除流动性 ****/

  /**
   * _removeLiquidity: 从流动性中移除LP代币的 removeLPTokensWei 数量，以及 ether 和 ZD618 代币的计算数量
   */
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveZD618(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveZD618(zero);
      setRemoveEther(zero);
    }
  };

  /**
   * _getTokensAfterRemove: 计算用户从合约中删除LP代币的 removeLPTokenWei 数量
   * 后将返回给用户的 Ether 和 ZD618 代币数量
   */
  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // 获取exchange合约的 eth 储备
      const _ethBalance = await getEtherBalance(provider, null, true);
      // 在交换合约中获得Eth储备
      const zeroDot618TokenReserve = await getReserveOfZD618Tokens(provider);
      // 从utils文件夹调用getTokensAfterRemove
      const { _removeEther, _removeZD618 } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        zeroDot618TokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveZD618(_removeZD618);
    } catch (err) {
      console.error(err);
    }
  };

  /**** END ****/

  /**
   * connectWallet: 连接钱包
   */
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or
   * without the signing capabilities of Metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading
   * transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction
   * needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being
   * sent. Metamask exposes a Signer API to allow your website to request
   * signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false
   * otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  /*
      renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
            You have:
            <br />
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {utils.formatEther(zD618Balance)} Crypto Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Crypto Dev LP tokens
          </div>
          <div>
            {/* If reserved ZD618 is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `ZD618` tokens can be added */}
            {utils.parseEther(reservedZD618.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of CryptoDev tokens"
                  onChange={(e) =>
                    setAddZD618Tokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the number of ZD618 tokens that
                    // can be added given  `e.target.value` amount of Eth
                    const _addZD618Tokens = await calculateZD618(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedZD618
                    );
                    setAddZD618Tokens(_addZD618Tokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addZD618Tokens)} Crypto Dev
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  // Calculate the amount of Ether and ZD618 tokens that the user would receive
                  // After he removes `e.target.value` amount of `LP` tokens
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                {`You will get ${utils.formatEther(removeZD618)} Crypto
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="cryptoDevToken">Crypto Dev Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {ethSelected
              ? `You will get ${utils.formatEther(
                tokenToBeReceivedAfterSwap
              )} Crypto Dev Tokens`
              : `You will get ${utils.formatEther(
                tokenToBeReceivedAfterSwap
              )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Crypto Dev Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(true);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./zerodot618.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by ZeroDot618 Devs
      </footer>
    </div>
  );
}