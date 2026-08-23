// checkout.js

let currentProduct = null;


// ========================================
// START
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await loadCheckout();

  }
);


// ========================================
// LOAD PRODUCT
// ========================================

async function loadCheckout() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const productId =
    params.get("id");


  if (!productId) {

    showError();

    return;
  }


  try {

    const {
      data: product,
      error
    } =
      await supabaseClient
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("published", true)
        .single();


    if (error) {
      throw error;
    }


    if (!product) {

      showError();

      return;
    }


    currentProduct =
      product;


    displayProduct(product);


    await loadPaymentSettings();


  } catch (error) {

    console.error(
      "Checkout error:",
      error
    );

    showError();

  }

}


// ========================================
// DISPLAY PRODUCT
// ========================================

function displayProduct(product) {

  document.title =
    "Checkout - " +
    product.title;


  document.getElementById(
    "checkoutImage"
  ).src =
    product.image_url ||
    "https://via.placeholder.com/400x300?text=Product";


  document.getElementById(
    "checkoutImage"
  ).alt =
    product.title;


  document.getElementById(
    "checkoutTitle"
  ).textContent =
    product.title;


  document.getElementById(
    "checkoutCategory"
  ).textContent =
    product.category ||
    "Digital Product";


  document.getElementById(
    "checkoutPrice"
  ).textContent =
    "$" +
    Number(
      product.price || 0
    ).toFixed(2);


  document.getElementById(
    "loading"
  ).style.display =
    "none";


  document.getElementById(
    "checkoutBox"
  ).style.display =
    "block";

}


// ========================================
// PAYMENT SETTINGS
// ========================================

async function loadPaymentSettings() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("payment_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();


    if (error) {
      throw error;
    }


    if (!data) {

      document.getElementById(
        "easypaisaNumber"
      ).textContent =
        "Not configured";


      document.getElementById(
        "jazzcashNumber"
      ).textContent =
        "Not configured";


      document.getElementById(
        "accountName"
      ).textContent =
        "Not configured";


      return;
    }


    document.getElementById(
      "easypaisaNumber"
    ).textContent =
      data.easypaisa_number ||
      "Not available";


    document.getElementById(
      "jazzcashNumber"
    ).textContent =
      data.jazzcash_number ||
      "Not available";


    document.getElementById(
      "accountName"
    ).textContent =
      data.account_name ||
      "Not available";


    document.getElementById(
      "paymentInstructions"
    ).textContent =
      data.instructions ||
      "Send the exact amount and keep your transaction ID.";


  } catch (error) {

    console.error(
      "Payment settings error:",
      error
    );

  }

}


// ========================================
// SUBMIT ORDER
// ========================================

document.getElementById(
  "checkoutForm"
)?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    if (!currentProduct) {
      return;
    }


    const name =
      document.getElementById(
        "customerName"
      ).value.trim();


    const email =
      document.getElementById(
        "customerEmail"
      ).value.trim();


    const transactionId =
      document.getElementById(
        "transactionId"
      ).value.trim();


    const message =
      document.getElementById(
        "checkoutMessage"
      );


    const button =
      document.getElementById(
        "placeOrderButton"
      );


    if (!name) {

      message.textContent =
        "Please enter your name.";

      return;
    }


    if (!email) {

      message.textContent =
        "Please enter your email.";

      return;
    }


    if (!transactionId) {

      message.textContent =
        "Please enter your transaction ID.";

      return;
    }


    button.disabled = true;

    button.textContent =
      "Submitting...";


    try {

      const orderId =
        createOrderId();


      const {
        error
      } =
        await supabaseClient
          .from("orders")
          .insert({

            order_id:
              orderId,

            product_id:
              currentProduct.id,

            customer_name:
              name,

            customer_email:
              email,

            amount:
              Number(
                currentProduct.price || 0
              ),

            transaction_id:
              transactionId,

            payment_status:
              "pending",

            order_status:
              "pending"

          });


      if (error) {
        throw error;
      }


      message.innerHTML = `

        <div style="
          padding:20px;
          border-radius:12px;
          background:#ecfdf5;
        ">

          <h3>
            ✅ Order Submitted
          </h3>

          <p>
            Your payment information has
            been submitted successfully.
          </p>

          <p>
            <strong>
              Order ID:
            </strong>
          </p>

          <h3>
            ${escapeHTML(orderId)}
          </h3>

          <p>
            Your payment will be verified
            manually.
          </p>

          <p>
            After verification, your digital
            product will be delivered.
          </p>

        </div>

      `;


      button.textContent =
        "Order Submitted ✓";


      button.disabled = true;


    } catch (error) {

      console.error(error);


      message.textContent =
        error.message ||
        "Unable to submit order.";


      button.disabled = false;


      button.textContent =
        "I Have Paid — Submit Order";

    }

  }
);


// ========================================
// ORDER ID
// ========================================

function createOrderId() {

  const random =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();


  return (
    "DS-" +
    Date.now() +
    "-" +
    random
  );

}


// ========================================
// ERROR
// ========================================

function showError() {

  document.getElementById(
    "loading"
  ).style.display =
    "none";


  document.getElementById(
    "checkoutBox"
  ).style.display =
    "none";


  document.getElementById(
    "checkoutError"
  ).style.display =
    "block";

}


// ========================================
// ESCAPE
// ========================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
