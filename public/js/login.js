import axios from "axios";
import { showAlert } from "./alerts";


export const login = async (email, password) => {
  // For testing purpose
  // console.log(email, password);
  try {
    const res = await axios({
      method: "post",
      url: "http://127.0.0.1:3000/api/v1/users/login",
      data: {
        email: email,
        password: password,
      }
    });
    // console.log("this is the response we are getting from axios", res.data);
    // this res here is what we got back from axios.
    if (res.data.status === "success") {
      showAlert("success", "Logged in Successfully!");
      window.setTimeout(() => {
        // location.assign is used to load another page. in our case we want overview page.
        location.assign("/");
      }, 1500);
    }
    // console.log(res.data.status, "this is response");
  } catch (err) {
    // axios will throw an error and this error will have err.response. 
    showAlert("error", err.response.data.message);

  }
}

export const logout = async () => {

  const res = await axios({
    method: "get",
    url: "http://127.0.0.1:3000/api/v1/users/logout",
  });
  try {
    if (res.data.status === "success") {
      location.reload(true);
      location.assign("/login");
    };
  } catch (err) {
    console.log(err.response);
    showAlert("error", "Error logging out! try again.");
  }
}

