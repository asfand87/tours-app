import axios from "axios";
import { showAlert } from "./alerts";


// type is either password or data.
export const updateSettings = async (data, type) => {
  try {
    const url = type === "password" ? "http://127.0.0.1:3000/api/v1/users/updateMyPassword" : "http://127.0.0.1:3000/api/v1/users/updateMe";

    const res = await axios({
      method: "PATCH",
      url: url,
      data: data
    });
    // console.log(res, "response is ");
    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()}Data updated Successfully`);
    }
  } catch (error) {
    // axios will throw an error and this error will have err.response. 
    showAlert("error", error.response.data.message);

  }
}