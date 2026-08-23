```javascript
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");

const adminProducts = document.getElementById("adminProducts");
const adminOrders = document.getElementById("adminOrders");

const logoutBtn = document.getElementById("logoutBtn");
const refreshProducts = document.getElementById("refreshProducts");
const refreshOrders = document.getElementById("refreshOrders");

const paymentSettingsForm =
  document.getElementById("paymentSettingsForm");

const paymentSettingsMessage =
  document.getElementById("paymentSettingsMessage");


// LOGIN CHECK
document.addEventListener("DOMContentLoaded", checkLogin);

async function checkLogin() {

  const result =
    await supabaseClient.auth.getSession();

  if (result.data.session) {
    showDashboard();
  } else {
    showLogin();
  }

}


// SHOW LOGIN
function showLogin() {

  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "none";
  }

}


// SHOW DASHBOARD
async function showDashboard() {

  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "block";
  }

  loadPaymentSettings();
  loadProducts();
  loadOrders();

}


// LOGIN
loginForm?.addEventListener("submit", async function(e) {

  e.preventDefault();

  loginMessage.textContent = "Logging in...";

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  const result =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (result.error) {

    loginMessage.textContent =
      result.error.message;

    return;

  }

  loginMessage.textContent =
    "Login successful.";

  showDashboard();

});


// LOGOUT
logoutBtn?.addEventListener("click", async function() {

  await supabaseClient.auth.signOut();

  showLogin();

});


// PAYMENT SETTINGS
async function loadPaymentSettings() {

  if (!paymentSettingsForm) {
    return;
  }

  try {

    const result =
      await supabaseClient
        .from("payment_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (result.error) {
      console.log(
        "Payment settings:",
        result.error.message
      );
      return;
    }

    if (!result.data) {
      return;
    }

    const data = result.data;

    document.getElementById("easypaisaName").value =
      data.easypaisa_name || "";

    document.getElementById("easypaisaNumber").value =
      data.easypaisa_number || "";

    document.getElementById("jazzcashName").value =
      data.jazzcash_name || "";

    document.getElementById("jazzcashNumber").value =
      data.jazzcash_number || "";

  } catch (error) {

    console.log(error);

  }

}


// SAVE PAYMENT SETTINGS
paymentSettingsForm?.addEventListener(
  "submit",
  async function(e) {

    e.preventDefault();

    paymentSettingsMessage.textContent =
      "Saving...";

    const values = {

      easypaisa_name:
        document
          .getElementById("easypaisaName")
          .value
          .trim(),

      easypaisa_number:
        document
          .getElementById("easypaisaNumber")
          .value
          .trim(),

      jazzcash_name:
        document
          .getElementById("jazzcashName")
          .value
          .trim(),

      jazzcash_number:
        document
          .getElementById("jazzcashNumber")
          .value
          .trim(),

      updated_at:
        new Date().toISOString()

    };


    try {

      const existing =
        await supabaseClient
          .from("payment_settings")
          .select("id")
          .limit(1)
          .maybeSingle();


      if (existing.error) {
        throw existing.error;
      }


      let result;


      if (existing.data) {

        result =
          await supabaseClient
            .from("payment_settings")
            .update(values)
            .eq(
              "id",
              existing.data.id
            );

      } else {

        result =
          await supabaseClient
            .from("payment_settings")
            .insert(values);

      }


      if (result.error) {
        throw result.error;
      }


      paymentSettingsMessage.textContent =
        "Payment details saved successfully.";

    } catch (error) {

      paymentSettingsMessage.textContent =
        error.message;

    }

  }
);


// LOAD PRODUCTS
async function loadProducts() {

  if (!adminProducts) {
    return;
  }

  adminProducts.innerHTML =
    "<p>Loading products...</p>";


  const result =
    await supabaseClient
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (result.error) {

    adminProducts.innerHTML =
      "<p>" +
      escapeHTML(
        result.error.message
      ) +
      "</p>";

    return;

  }


  if (!result.data || result.data.length === 0) {

    adminProducts.innerHTML =
      "<p>No products yet.</p>";

    return;

  }


  adminProducts.innerHTML =
    result.data.map(function(product) {

      return `

        <div style="
          padding:15px;
          margin-bottom:15px;
          border:1px solid #ddd;
          border-radius:12px;
        ">

          <img
            src="${product.image_url || ""}"
            style="
              width:180px;
              height:120px;
              object-fit:cover;
              border-radius:10px;
            "
          >

          <h3>
            ${escapeHTML(product.title)}
          </h3>

          <p>
            ${escapeHTML(product.description || "")}
          </p>

          <strong>
            $${Number(product.price || 0).toFixed(2)}
          </strong>

          <br><br>

          <button
            onclick="deleteProduct(${product.id})"
          >
            Delete
          </button>

        </div>

      `;

    }).join("");

}


// LOAD ORDERS
async function loadOrders() {

  if (!adminOrders) {
    return;
  }

  adminOrders.innerHTML =
    "<p>Loading orders...</p>";


  const result =
    await supabaseClient
      .from("orders")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (result.error) {

    adminOrders.innerHTML =
      "<p>Order error: " +
      escapeHTML(
        result.error.message
      ) +
      "</p>";

    return;

  }


  if (!result.data || result.data.length === 0) {

    adminOrders.innerHTML =
      "<p>No orders received yet.</p>";

    return;

  }


  adminOrders.innerHTML =
    result.data.map(function(order) {

      const orderId =
        order.order_id ||
        order.id ||
        "N/A";

      const name =
        order.customer_name ||
        order.name ||
        "N/A";

      const email =
        order.customer_email ||
        order.email ||
        "N/A";

      const amount =
        order.amount ||
        order.total_amount ||
        0;

      const payment =
        order.payment_status ||
        "pending";

      const transaction =
        order.transaction_id ||
        "Not provided";

      return `

        <div style="
          padding:20px;
          margin-bottom:15px;
          border:1px solid #ddd;
          border-radius:14px;
        ">

          <h3>
            Order #${escapeHTML(orderId)}
          </h3>

          <p>
            <strong>Customer:</strong>
            ${escapeHTML(name)}
          </p>

          <p>
            <strong>Email:</strong>
            ${escapeHTML(email)}
          </p>

          <p>
            <strong>Amount:</strong>
            $${Number(amount).toFixed(2)}
          </p>

          <p>
            <strong>Payment:</strong>
            ${
              String(payment).toLowerCase() === "paid"
                ? "Paid"
                : escapeHTML(payment)
            }
          </p>

          <p>
            <strong>Transaction ID:</strong>
            ${escapeHTML(transaction)}
          </p>

          <details>

            <summary>
              View complete order
            </summary>

            <pre style="
              white-space:pre-wrap;
              word-break:break-word;
            ">${escapeHTML(
              JSON.stringify(
                order,
                null,
                2
              )
            )}</pre>

          </details>

        </div>

      `;

    }).join("");

}


// DELETE PRODUCT
async function deleteProduct(id) {

  if (!confirm("Delete this product?")) {
    return;
  }

  const result =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);

  if (result.error) {

    alert(result.error.message);

    return;

  }

  loadProducts();

}


// REFRESH
refreshProducts?.addEventListener(
  "click",
  loadProducts
);

refreshOrders?.addEventListener(
  "click",
  loadOrders
);


// ADD PRODUCT
productForm?.addEventListener(
  "submit",
  async function(e) {

    e.preventDefault();

    productMessage.textContent =
      "Uploading product...";


    try {

      const title =
        document
          .getElementById("productTitle")
          .value
          .trim();

      const description =
        document
          .getElementById("productDescription")
          .value
          .trim();

      const price =
        Number(
          document
            .getElementById("productPrice")
            .value
        );

      const category =
        document
          .getElementById("productCategory")
          .value
          .trim();

      const featured =
        document
          .getElementById("featuredProduct")
          .checked;

      const imageFile =
        document
          .getElementById("productImage")
          .files[0];

      const digitalFile =
        document
          .getElementById("productFile")
          .files[0];


      if (!imageFile) {
        throw new Error(
          "Please select product image."
        );
      }

      if (!digitalFile) {
        throw new Error(
          "Please select digital product file."
        );
      }


      const unique =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 8);


      const imagePath =
        "products/" +
        unique +
        "-" +
        cleanFileName(
          imageFile.name
        );


      const imageUpload =
        await supabaseClient.storage
          .from("product-images")
          .upload(
            imagePath,
            imageFile,
            {
              upsert: false,
              contentType: imageFile.type
            }
          );


      if (imageUpload.error) {
        throw imageUpload.error;
      }


      const imagePublic =
        supabaseClient.storage
          .from("product-images")
          .getPublicUrl(
            imagePath
          );


      const filePath =
        "products/" +
        unique +
        "-" +
        cleanFileName(
          digitalFile.name
        );


      const fileUpload =
        await supabaseClient.storage
          .from("digital-products")
          .upload(
            filePath,
            digitalFile,
            {
              upsert: false,
              contentType: digitalFile.type
            }
          );


      if (fileUpload.error) {

        await supabaseClient.storage
          .from("product-images")
          .remove([
            imagePath
          ]);

        throw fileUpload.error;

      }


      const filePublic =
        supabaseClient.storage
          .from("digital-products")
          .getPublicUrl(
            filePath
          );


      const slug =
        createSlug(title) +
        "-" +
        Date.now();


      const insert =
        await supabaseClient
          .from("products")
          .insert({

            title: title,

            slug: slug,

            description: description,

            price: price,

            category:
              category ||
              "Digital Product",

            image_url:
              imagePublic.data.publicUrl,

            file_url:
              filePublic.data.publicUrl,

            featured: featured,

            published: true,

            created_at:
              new Date().toISOString()

          });


      if (insert.error) {

        await supabaseClient.storage
          .from("product-images")
          .remove([
            imagePath
          ]);

        await supabaseClient.storage
          .from("digital-products")
          .remove([
            filePath
          ]);

        throw insert.error;

      }


      productMessage.textContent =
        "Product published successfully.";

      productForm.reset();

      loadProducts();


    } catch (error) {

      console.error(error);

      productMessage.textContent =
        error.message;

    }

  }
);


// HELPERS
function cleanFileName(name) {

  return name
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    );

}


function createSlug(text) {

  return text
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
```
