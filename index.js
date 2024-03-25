const express = require("express");
const bodyParser = require("body-parser");
const engines = require("consolidate");
const paypal = require("paypal-rest-sdk");

const app = express();

app.engine("ejs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

paypal.configure({
    mode: "sandbox", //sandbox or live
    client_id:
        "AYldU0pYqpOOsaKvPNeMcQGCePPm1MnVqMLpKNuWmLS8y60m346MTgUdLs0RXAqN4yLodHUPKDb1P-Gd",
    client_secret:
        "EMCBdRAPfNMprBfwZY_i4y9oQcue3XLrFjdL6Ll-p9G5Rqtns-OgDBtHRjD4IWYpS2S7CeGgKbgTsz7J"
});

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/paypal", async (req, res) => {
  const {total} = req.body;

  const create_payment_json = {
      intent: "sale",
      payer: {
          payment_method: "paypal"
      },
      redirect_urls: {
          return_url: "https://laundry-api-8guz.onrender.com/success",
          cancel_url: "https://laundry-api-8guz.onrender.com/cancel"
      },
      transactions: [
          {
              item_list: {
                  items: [
                      {
                        name: "Order Payment",
                            sku: "item",
                            price: total,
                            currency: "USD",
                            quantity: 1
                      }
                  ]
              },
              amount: {
                currency: "USD",
                total: total
              },
              description: 'Payment for order',
          }
      ]
  };

  console.log("PayPal Payment Request:", create_payment_json);

  paypal.payment.create(create_payment_json, function(error, payment) {
      if (error) {
        console.error('Create Payment Error:', error);
        res.status(500).json({ error: 'Error creating PayPal payment' });
      } else {
          console.log("Create Payment Response:", payment);
          res.json({ paypalUrl: payment.links[1].href });
          //res.redirect(payment.links[1].href);
          console.log("Payment Amount:", payment.transactions[0].amount);
      }
  });
});

app.get("/success", (req, res) => {
  // res.send("Success");
  var PayerID = req.query.PayerID;
  var paymentId = req.query.paymentId;
  const {total} = req.query;
  var execute_payment_json = {
      payer_id: PayerID,
      transactions: [
          {
              amount: {
                  currency: "USD",
                  total: total,
              }
          }
      ]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function(
      error,
      payment
  ) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log("Get Payment Response");
          console.log(JSON.stringify(payment));
          res.render("success");
      }
  });
});

app.get("cancel", (req, res) => {
  res.render("cancel");
});

app.listen(3000, () => {
  console.log("Server is running");
});