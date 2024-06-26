import React, { useEffect, useRef } from "react";
import Web3 from "web3";
import styles from "./AddProduct.module.css";
import { useSelector } from "react-redux";

import { ADD_PRODUCT_POPUP_DATA } from "../../Utils/Constants/StaticData";
import notify from "../../Utils/Helpers/notifyToast";

import Button from "../Button";
import { Checkbox } from "@mui/material";
import { ReactComponent as PlusIcon } from "../../Assets/AddProduct/Plus.svg";
import { ReactComponent as DeleteIcon } from "../../Assets/AddProduct/Delete.svg";
import { uploadImage } from "../../Services/storage.service";
import { addProduct } from "../../Services/product.service";
import Preloader from "../Preloader";
import axios from "axios";

function Payment({ closePopupFunction }) {
  const paymentsData = useSelector((state) => state.popUpReducer.payment);

  const [processing, setProcessing] = React.useState(true);
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [buyerAddress, setBuyerAddress] = React.useState("");
  const [itemPriceInWei, setItemPriceInWie] = React.useState(0);
  const [itemPriceInEth, setItemPriceInEth] = React.useState(0);

  const connectWallet = async () => {
    try {
      setProcessing(true);
      if (window.ethereum) {
        console.log("MetaMask is installed");
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.send("eth_requestAccounts");
        // Get account address
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        console.log("1. From MetaMask: ", accounts[0]);

        if (accounts.length > 0) {
          setBuyerAddress(accounts[0]);
          setWalletConnected(true);
        } else {
          setWalletConnected(false);
        }
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
        const accounts = await window.web3.eth.getAccounts();
        console.log("2. From MetaMask: ", accounts[0]);
        if (accounts.length > 0) {
          setBuyerAddress(accounts[0]);
          setWalletConnected(true);
        } else {
          setWalletConnected(false);
        }
      } else {
        console.log(
          "Non-Ethereum browser detected. You should consider trying MetaMask!"
        );
        setWalletConnected(false);
      }
      setProcessing(false);
    } catch (err) {
      console.log(err);
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (paymentsData.show) {
      connectWallet();
    }
  }, [paymentsData.show]);

  useEffect(() => {
    const fetchPrice = async () => {
      if (paymentsData.show) {
        // convert item price from inr to wei
        const ethPrice = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr`
        );

        const itemPriceInINR = paymentsData.data.amount;
        const itemPriceInETH = itemPriceInINR / ethPrice.data.ethereum.inr;
        const itemPriceInWei = Web3.utils.toWei(
          itemPriceInETH.toFixed(10).toString(),
          "ether"
        );

        console.log("itemPriceInETH", itemPriceInETH);
        console.log("itemPriceInWei", itemPriceInWei);
        console.log("itemPriceInINR", itemPriceInINR);
        console.log("ethPrice", ethPrice);
        setItemPriceInWie(itemPriceInWei);
        setItemPriceInEth(itemPriceInETH);
      }
    };
    fetchPrice();
  }, [paymentsData]);

  const makePaymentRequest = () => {
    const sellerAddress = "0xB46233500f2eDEaba24674e0714D344C08916ec2";
    // Start wallet payment process
    const amountInHash = Web3.utils.toHex(itemPriceInWei);
    window.ethereum
      .request({
        method: "eth_sendTransaction",
        params: [
          { from: buyerAddress, to: sellerAddress, value: amountInHash },
        ],
      })
      .then((response) => {
        console.log(response);
        notify("Payment Successful", "success");
        paymentsData.data.callbackFun();
        closePopupFunction();
        return true;
      })
      .catch((error) => {
        console.log(error);
        notify("Payment Failed", "error");
        return false;
      });
  };

  return (
    <div className={styles.Wrapper}>
      {processing ? (
        <Preloader />
      ) : !walletConnected ? (
        <div className={styles.WalletNotConnected}>
          <h2>Please connect your wallet to make payment</h2>
          <Button
            onClick={() => {
              connectWallet();
            }}
            wrapperClass={styles.ConnectWalletButton}
            primaryColor={`var(--primary-blue)`}
            name="Connect Wallet"
          />
        </div>
      ) : (
        <div className={styles.WalletConnected}>
          <div className={styles.WalletConnectedText}>
            <div>Wallet Connected</div>
            <div>Address: {buyerAddress}</div>
          </div>
          <div className={styles.paymentConfirmation}>
            <h2>
              Confirm Payment of {paymentsData.data.amount}INR (
              {itemPriceInEth.toString().slice(0, 8)}ETH)
            </h2>
            <Button
              onClick={() => {
                makePaymentRequest();
              }}
              wrapperClass={styles.ConnectWalletButton}
              primaryColor={`var(--primary-blue)`}
              name="Complete Payment"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;
