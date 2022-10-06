import "regenerator-runtime/runtime";
import { showAlert } from "./alerts";
import { login, logout } from "./login";
import { displayMap } from "./mapbox";
import { bookTour } from "./stripe";
import { updateSettings } from "./updateSettings";

// DOM Elements
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataFrom = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");
// Delegation

if (mapBox) {
  const locations = JSON.parse(document.getElementById('map').dataset.locations);
  displayMap(locations);
}

// 1 Add the event listener to the form. 
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}
if (userDataFrom) {
  userDataFrom.addEventListener("submit", (e) => {
    e.preventDefault();
    // thing to remember here is that we are getting the values here so we need to find a way to get the value of the photo and then to append it to the form. so we will use FormData 
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    updateSettings(form, "data");
  })
}


if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating..."
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings({ passwordCurrent, password, passwordConfirm }, "password");

    document.querySelector(".btn--save-password").textContent = "save password".toUpperCase();
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });


}

if (bookBtn) {
  bookBtn.addEventListener("click", e => {
    e.target.textContent = "Processing...";
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  })
}

const alertMessage = document.querySelector("body").dataset.alert;
if (alert) showAlert("success", alertMessage, 20);


