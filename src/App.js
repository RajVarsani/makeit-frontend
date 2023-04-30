import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import { useCookies } from "react-cookie";

import styles from "./App.module.css";
import "react-toastify/dist/ReactToastify.css";

import {
  UPDATE_USER_DATA,
  UPDATE_ADD_ADDRESS_POPUP_STATE,
  UPDATE_ADD_PRODUCT_POPUP_STATE,
} from "./Redux/ActionTypes";

import { getUserData } from "./Services/user.service";
import notify from "./Utils/Helpers/notifyToast";

import Home from "./Containers/Home";
import { ToastContainer } from "react-toastify";
import Preloader from "./Components/Preloader";

const App = () => {
  const userData = useSelector((state) => state.userReducer.userData);
  const popupStates = useSelector((state) => state.popUpReducer);
  const dispatch = useDispatch();
  const [cookie, setCookie] = useCookies(["token"]);

  const [initialized, setInitialized] = useState(false);

  useEffect(async () => {
    fetchUserData();
  }, [cookie]);

  useEffect(() => {
    console.log("userData", userData);
    if (userData) {
      setInitialized(true);
    }
  }, [userData]);

  useEffect(() => {
    console.log(cookie.token);
  }, [cookie.token]);

  const fetchUserData = async () => {
    // setCookie(
    //   "token",
    //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxZDEyZjUwYmQ3ODY4NzBiODdmMmY4ZiIsImlhdCI6MTY0MTA5OTA4OH0.kY_HiMKWRfbAZoeH2MSwb8F7zdWzKrmDU79AZ_3BoJI",
    //   { sameSite: "strict" }
    // );

    if (cookie.token) {
      try {
        const localeUserData = await getUserData(cookie.token);
        localeUserData.accessToken = cookie.token;
        localeUserData.isSeller = localeUserData.role === "seller";

        dispatch({
          type: UPDATE_USER_DATA,
          data: localeUserData,
        });
      } catch (err) {
        notify("Internal Server Error", "error");
        dispatch({
          type: UPDATE_USER_DATA,
          data: null,
        });
        setInitialized(true);
      }
    } else {
      dispatch({
        type: UPDATE_USER_DATA,
        data: null,
      });
      setInitialized(true);
    }
  };

  const closeAddAddressPopup = () => {
    dispatch({
      type: UPDATE_ADD_ADDRESS_POPUP_STATE,
      value: false,
    });
  };

  const closeAddProductPopup = () => {
    dispatch({
      type: UPDATE_ADD_PRODUCT_POPUP_STATE,
      value: false,
    });
  };

  return (
    <>
      <ToastContainer bodyClassName={styles.ToastBody} />
      {initialized ? (
        <Routes>
          <Route path={"/"} element={<Home />} />
        </Routes>
      ) : (
        <>
          <Preloader />
        </>
      )}
    </>
  );
};

export default App;
