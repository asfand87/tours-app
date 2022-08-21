import axios from 'axios';
import { showAlert } from "./alerts";


export const bookTour = async tourId => {
  try {

    var stripe = Stripe('pk_test_51LIO3qBdeMgdtwUIlWWDHe8IvVGjAbIvR1g3cNuCRxIrRNtVp26ZBNIDo5rHfF3qZLAz2T1yTxH7QviGmfqMQEsG001bxxiFee');
    // 1) get checkout session from API
    const session = await axios(`http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`);
    // for testing purposes
    // console.log(session);
    // 2) Create checkout form + charge the card.
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {


    // console.log(err);
    showAlert("error", err);
  }

}
