```javascript
// =====================================
// DIGITAL STORE ADMIN - COMPLETE
// =====================================

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


// =====================================
// START
// =====================================

document.addEventListener("DOMContentLoaded", async () => {
  await checkLogin();
});


// =====================================
// CHECK LOGIN
// =====================================

async function checkLogin() {

  try {

    const {
      data: {
        session
      }
    } = await supabaseClient.auth.getSession();

    if (session) {
      await showDashboard();
    } else {
      showLogin();
    }

  } catch (error) {

    console.error(error);
    showLogin();

  }

}


// =====================================
// LOGIN
// =====================================

loginForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  loginMessage.textContent = "Logging in...";

  const {
    error
  } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {

    loginMessage.textContent =
      "❌ " + error.message;

    return;

  }

  loginMessage.textContent =
    "✅ Login successful.";

  await showDashboard();

});


// =====================================
// LOGOUT
// =====================================

logoutBtn?.addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  showLogin();

});


// =====================================
// SHOW LOGIN
// =====================================

function showLogin() {

  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "none";
  }

}


// =====================================
// SHOW DASHBOARD
// =====================================

async function showDashboard() {

  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "block";
  }

  await loadPaymentSettings();
  await loadProducts();
  await loadOrders();

}


// =====================================
// PAYMENT SETTINGS - LOAD
// =====================================

async function loadPaymentSettings() {

  if (!paymentSettingsForm) {
    return;
  }

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("payment_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return;
    }

    const easypaisaName =
      document.getElementById("easypaisaName");

    const easypaisaNumber =
      document.getElementById("easypaisaNumber");

    const jazzcashName =
      document.getElementById("jazzcashName");

    const jazzcashNumber =
      document.getElementById("jazzcashNumber");

    if (easypaisaName) {
      easypaisaName.value =
        data.easypaisa_name || "";
    }

    if (easypaisaNumber) {
      easypaisaNumber.value =
        data.easypaisa_number || "";
    }

    if (jazzcashName) {
      jazzcashName.value =
        data.jazzcash_name || "";
    }

    if (jazzcashNumber) {
      jazzcashNumber.value =
        data.jazzcash_number || "";
    }

  } catch (error) {

    console.error(
      "Payment settings error:",
      error
    );

    if (paymentSettingsMessage) {
      paymentSettingsMessage.textContent =
        "❌ " + error.message;
    }

  }

}


// =====================================
// PAYMENT SETTINGS - SAVE
// =====================================

paymentSettingsForm?.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    paymentSettingsMessage.textContent =
      "Saving...";

    try {

      const easypaisaName =
        document
          .getElementById("easypaisaName")
          .value
          .trim();

      const easypaisaNumber =
        document
          .getElementById("easypaisaNumber")
          .value
          .trim();

      const jazzcashName =
        document
          .getElementById("jazzcashName")
          .value
          .trim();

      const jazzcashNumber =
        document
          .getElementById("jazzcashNumber")
          .value
          .trim();


      const {
        data: existing,
        error: findError
      } = await supabaseClient
        .from("payment_settings")
        .select("id")
        .limit(1)
        .maybeSingle();


      if (findError) {
        throw findError;
      }


      let result;


      if (existing) {

        result =
          await supabaseClient
            .from("payment_settings")
            .update({

              easypaisa_name:
                easypaisaName,

              easypaisa_number:
                easypaisaNumber,

              jazzcash_name:
                jazzcashName,

              jazzcash_number:
                jazzcashNumber,

              updated_at:
                new Date().toISOString()

            })
            .eq(
              "id",
              existing.id
            );

      } else {

        result =
          await supabaseClient
            .from("payment_settings")
            .insert({

              easypaisa_name:
                easypaisaName,

              easypaisa_number:
                easypaisaNumber,

              jazzcash_name:
                jazzcashName,

              jazzcash_number:
                jazzcashNumber,

              updated_at:
                new Date().toISOString()

            });

      }


      if (result.error) {
        throw result.error;
      }


      paymentSettingsMessage.textContent =
        "✅ Payment details saved successfully!";

    } catch (error) {

      console.error(error);

      paymentSettingsMessage.textContent =
        "❌ " + error.message;

    }

  }
);


// =====================================
// ADD PRODUCT
// =====================================

productForm?.addEventListener(
  "submit",
  async (e) => {

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

      const imageInput =
        document.getElementById("productImage");

      const fileInput =
        document.getElementById("productFile");


      if (!title) {
        throw new Error(
          "Product title is required."
        );
      }

      if (!Number.isFinite(price)) {
        throw new Error(
          "Enter a valid price."
        );
      }

      if (!imageInput?.files?.length) {
        throw new Error(
          "Please select a product image."
        );
      }

      if (!fileInput?.files?.length) {
        throw new Error(
          "Please select the digital product file."
        );
      }


      const unique =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 8);


      // =================================
      // IMAGE UPLOAD
      // =================================

      const imageFile =
        imageInput.files[0];

      const imagePath =
        "products/" +
        unique +
        "-" +
        cleanFileName(
          imageFile.name
        );


      const {
        error: imageUploadError
      } = await supabaseClient.storage
        .from("product-images")
        .upload(
          imagePath,
          imageFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type
          }
        );


      if (imageUploadError) {
        throw new Error(
          "Image upload failed: " +
          imageUploadError.message
        );
      }


      const {
        data: imagePublicData
      } = supabaseClient.storage
        .from("product-images")
        .getPublicUrl(
          imagePath
        );


      const imageUrl =
        imagePublicData.publicUrl;


      // =================================
      // DIGITAL FILE UPLOAD
      // =================================

      const digitalFile =
        fileInput.files[0];

      const filePath =
        "products/" +
        unique +
        "-" +
        cleanFileName(
          digitalFile.name
        );


      const {
        error: fileUploadError
      } = await supabaseClient.storage
        .from("digital-products")
        .upload(
          filePath,
          digitalFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: digitalFile.type
          }
        );


      if (fileUploadError) {

        await supabaseClient.storage
          .from("product-images")
          .remove([
            imagePath
          ]);

        throw new Error(
          "Digital file upload failed: " +
          fileUploadError.message
        );

      }


      const {
        data: filePublicData
      } = supabaseClient.storage
        .from("digital-products")
        .getPublicUrl(
          filePath
        );


      const fileUrl =
        filePublicData.publicUrl;


      // =================================
      // SLUG
      // =================================

      const slug =
        createSlug(title) +
        "-" +
        Date.now();


      // =================================
      // SAVE PRODUCT
      // =================================

      const {
        error: databaseError
      } = await supabaseClient
        .from("products")
        .insert({

          title,
          slug,
          description,
          price,

          category:
            category ||
            "Digital Product",

          image_url:
            imageUrl,

          file_url:
            fileUrl,

          featured,
          published: true,

          created_at:
            new Date().toISOString()

        });


      if (databaseError) {

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

        throw new Error(
          "Database error: " +
          databaseError.message
        );

      }


      productMessage.textContent =
        "✅ Product published successfully!";

      productForm.reset();

      await loadProducts();


    } catch (error) {

      console.error(error);

      productMessage.textContent =
        "❌ " + error.message;

    }

  }
);


// =====================================
// LOAD PRODUCTS
// =====================================

async function loadProducts() {

  if (!adminProducts) {
    return;
  }

  adminProducts.innerHTML =
    "<p>Loading products...</p>";

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    if (!data?.length) {

      adminProducts.innerHTML =
        "<p>No products yet.</p>";

      return;

    }


    adminProducts.innerHTML =
      data.map(product => `

        <div style="
          display:flex;
          gap:20px;
          margin-bottom:20px;
          padding:15px;
          border:1px solid #ddd;
          border-radius:12px;
        ">

          <img
            src="${
              product.image_url ||
              "https://via.placeholder.com/400x250?text=No+Image"
            }"
            alt="${escapeHTML(product.title)}"
            style="
              width:180px;
              height:120px;
              object-fit:cover;
              border-radius:10px;
            "
          >

          <div>

            <h3>
              ${escapeHTML(product.title)}
            </h3>

            <p>
              ${escapeHTML(
                product.description || ""
              )}
            </p>

            <strong>
              $${Number(
                product.price || 0
              ).toFixed(2)}
            </strong>

            <p>
              ${
                product.published
                  ? "🟢 Published"
                  : "🟡 Draft"
              }
            </p>

            <button
              onclick="deleteProduct(${product.id})"
            >
              Delete
            </button>

          </div>

        </div>

      `).join("");


  } catch (error) {

    console.error(
      "Products error:",
      error
    );

    adminProducts.innerHTML =
      "<p>❌ " +
      escapeHTML(
        error.message
      ) +
      "</p>";

  }

}


// =====================================
// LOAD ORDERS
// =====================================

async function loadOrders() {

  if (!adminOrders) {
    return;
  }

  adminOrders.innerHTML =
    "<p>⏳ Loading orders...</p>";


  try {

    const {
      data: orders,
      error
    } = await supabaseClient
      .from("orders")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    if (!orders?.length) {

      adminOrders.innerHTML = `
        <div style="
          padding:20px;
          border-radius:12px;
          background:#f5f5f5;
        ">

          <h3>
            No orders received yet.
          </h3>

          <p>
            New customer orders will appear here.
          </p>

        </div>
      `;

      return;

    }


    adminOrders.innerHTML =
      orders.map(order => {

        const orderId =
          order.order_id ??
          order.id ??
          "N/A";

        const customerName =
          order.customer_name ??
          order.name ??
          "N/A";

        const customerEmail =
          order.customer_email ??
          order.email ??
          "N/A";

        const amount =
          order.amount ??
          order.total_amount ??
          order.price ??
          0;

        const paymentStatus =
          order.payment_status ??
          "pending";

        const transactionId =
          order.transaction_id ??
          order.payment_reference ??
          "Not provided";

        const orderStatus =
          order.order_status ??
          order.status ??
          "pending";

        const productName =
          order.product_name ??
          order.product_title ??
          "Digital Product";

        const paymentMethod =
          order.payment_method ??
          "N/A";

        const createdAt =
          order.created_at
            ? new Date(
                order.created_at
              ).toLocaleString()
            : "N/A";


        const isPaid =
          String(
            paymentStatus
          ).toLowerCase() === "paid";


        return `

          <div style="
            border:1px solid #ddd;
            border-radius:16px;
            padding:20px;
            margin-bottom:20px;
            background:#fff;
            box-shadow:0 4px 15px rgba(0,0,0,.06);
          ">

            <h3>
              🧾 Order #${escapeHTML(
                orderId
              )}
            </h3>


            <p>
              <strong>Customer:</strong>
              ${escapeHTML(
                customerName
              )}
            </p>


            <p>
              <strong>Email:</strong>
              ${escapeHTML(
                customerEmail
              )}
            </p>


            <p>
              <strong>Product:</strong>
              ${escapeHTML(
                productName
              )}
            </p>


            <p>
              <strong>Amount:</strong>
              $${Number(
                amount
              ).toFixed(2)}
            </p>


            <p>
              <strong>Payment Method:</strong>
              ${escapeHTML(
                paymentMethod
              )}
            </p>


            <p>
              <strong>Transaction ID:</strong>
              ${escapeHTML(
                transactionId
              )}
            </p>


            <p>
              <strong>Payment:</strong>
              ${
                isPaid
                  ? "🟢 Paid"
                  : "🟡 " +
                    escapeHTML(
                      paymentStatus
                    )
              }
            </p>


            <p>
              <strong>Order Status:</strong>
              ${escapeHTML(
                orderStatus
              )}
            </p>


            <p>
              <strong>Date:</strong>
              ${escapeHTML(
                createdAt
              )}
            </p>


            <details>

              <summary>
                View complete order data
              </summary>

              <pre style="
                white-space:pre-wrap;
                word-break:break-word;
                background:#f5f5f5;
                padding:12px;
                border-radius:8px;
                font-size:12px;
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


  } catch (error) {

    console.error(
      "Orders loading error:",
      error
    );


    adminOrders.innerHTML = `

      <div style="
        padding:20px;
        border-radius:12px;
        background:#fff0f0;
        border:1px solid #ffcccc;
      ">

        <h3>
          ❌ Could not load orders
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>

    `;

  }

}


// =====================================
// DELETE PRODUCT
// =====================================

async function deleteProduct(id) {

  if (
    !confirm(
      "Delete this product?"
    )
  ) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("products")
    .delete()
    .eq(
      "id",
      id
    );


  if (error) {

    alert(
      error.message
    );

    return;

  }


  await loadProducts();

}


// =====================================
// REFRESH BUTTONS
// =====================================

refreshProducts?.addEventListener(
  "click",
  async () => {
    await loadProducts();
  }
);


refreshOrders?.addEventListener(
  "click",
  async () => {
    await loadOrders();
  }
);


// =====================================
// HELPERS
// =====================================

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

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
```
