// admin.js

const loginSection =
  document.getElementById("loginSection");

const dashboardSection =
  document.getElementById("dashboardSection");

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");

const productForm =
  document.getElementById("productForm");

const productMessage =
  document.getElementById("productMessage");

const adminProducts =
  document.getElementById("adminProducts");

const logoutBtn =
  document.getElementById("logoutBtn");

const refreshProducts =
  document.getElementById("refreshProducts");


// =====================================
// CHECK LOGIN
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await checkLogin();

  }
);


async function checkLogin() {

  const {
    data: { session }
  } =
    await supabaseClient.auth.getSession();


  if (session) {

    showDashboard();

  } else {

    showLogin();

  }

}


// =====================================
// LOGIN
// =====================================

loginForm?.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    const email =
      document
        .getElementById("email")
        .value
        .trim();


    const password =
      document
        .getElementById("password")
        .value;


    loginMessage.textContent =
      "Logging in...";


    const {
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({

          email,
          password

        });


    if (error) {

      loginMessage.textContent =
        error.message;

      return;

    }


    loginMessage.textContent =
      "Login successful.";


    showDashboard();

  }
);


// =====================================
// LOGOUT
// =====================================

logoutBtn?.addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    showLogin();

  }
);


// =====================================
// SHOW LOGIN
// =====================================

function showLogin() {

  if (loginSection) {

    loginSection.style.display =
      "block";

  }


  if (dashboardSection) {

    dashboardSection.style.display =
      "none";

  }

}


// =====================================
// SHOW DASHBOARD
// =====================================

async function showDashboard() {

  if (loginSection) {

    loginSection.style.display =
      "none";

  }


  if (dashboardSection) {

    dashboardSection.style.display =
      "block";

  }


  createOrdersSection();


  await loadProducts();


  await loadOrders();

}


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
        document.getElementById(
          "productImage"
        );


      const fileInput =
        document.getElementById(
          "productFile"
        );


      // =====================================
      // VALIDATION
      // =====================================

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


      if (!imageInput.files.length) {

        throw new Error(
          "Please select a product image."
        );

      }


      if (!fileInput.files.length) {

        throw new Error(
          "Please select the digital product file."
        );

      }


      // =====================================
      // UNIQUE ID
      // =====================================

      const unique =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 8);


      // =====================================
      // IMAGE UPLOAD
      // =====================================

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
      } =
        await supabaseClient.storage
          .from("product-images")
          .upload(
            imagePath,
            imageFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                imageFile.type
            }
          );


      if (imageUploadError) {

        throw new Error(
          "Image upload failed: " +
          imageUploadError.message
        );

      }


      // =====================================
      // IMAGE URL
      // =====================================

      const {
        data: imagePublicData
      } =
        supabaseClient.storage
          .from("product-images")
          .getPublicUrl(
            imagePath
          );


      if (
        !imagePublicData ||
        !imagePublicData.publicUrl
      ) {

        throw new Error(
          "Could not create image URL."
        );

      }


      const imageUrl =
        imagePublicData.publicUrl;


      // =====================================
      // DIGITAL FILE
      // =====================================

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
      } =
        await supabaseClient.storage
          .from("digital-products")
          .upload(
            filePath,
            digitalFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                digitalFile.type
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


      // =====================================
      // FILE URL
      // =====================================

      const {
        data: filePublicData
      } =
        supabaseClient.storage
          .from("digital-products")
          .getPublicUrl(
            filePath
          );


      const fileUrl =
        filePublicData.publicUrl;


      // =====================================
      // SLUG
      // =====================================

      const slug =
        createSlug(title) +
        "-" +
        Date.now();


      // =====================================
      // SAVE PRODUCT
      // =====================================

      const {
        error: databaseError
      } =
        await supabaseClient
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

            published:
              true,

            created_at:
              new Date()
                .toISOString()

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
        "❌ " +
        error.message;

    }

  }
);


// =====================================
// LOAD PRODUCTS
// =====================================

async function loadProducts() {

  if (!adminProducts)
    return;


  adminProducts.innerHTML =
    "<p>Loading products...</p>";


  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    adminProducts.innerHTML =
      "<p>" +
      escapeHTML(
        error.message
      ) +
      "</p>";

    return;

  }


  if (
    !data ||
    data.length === 0
  ) {

    adminProducts.innerHTML =
      "<p>No products yet.</p>";

    return;

  }


  adminProducts.innerHTML =
    data
      .map(
        product => `

        <div
          class="admin-product"
          style="
            margin-bottom:20px;
            padding:15px;
            border:1px solid #ddd;
            border-radius:12px;
          "
        >

          <img
            src="${
              product.image_url ||
              "https://via.placeholder.com/400x250?text=No+Image"
            }"
            alt="${escapeHTML(
              product.title
            )}"
            style="
              width:200px;
              height:130px;
              object-fit:cover;
              border-radius:10px;
            "
            onerror="
              this.src='https://via.placeholder.com/400x250?text=Image+Error'
            "
          >


          <div>

            <h3>
              ${escapeHTML(
                product.title
              )}
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
              onclick="
                deleteProduct(
                  ${product.id}
                )
              "
            >
              Delete
            </button>

          </div>

        </div>

      `
      )
      .join("");

}


// =====================================
// CREATE ORDERS SECTION
// =====================================

function createOrdersSection() {

  if (
    document.getElementById(
      "ordersSection"
    )
  ) {

    return;

  }


  const section =
    document.createElement(
      "div"
    );


  section.id =
    "ordersSection";


  section.className =
    "admin-card";


  section.style.marginTop =
    "30px";


  section.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        flex-wrap:wrap;
      "
    >

      <h2>
        🧾 Customer Orders
      </h2>


      <button
        type="button"
        id="refreshOrders"
      >
        Refresh Orders
      </button>

    </div>


    <div
      id="adminOrders"
      style="margin-top:20px;"
    >

      <p>
        Loading orders...
      </p>

    </div>

  `;


  dashboardSection.appendChild(
    section
  );


  document
    .getElementById(
      "refreshOrders"
    )
    .addEventListener(
      "click",
      loadOrders
    );

}


// =====================================
// LOAD ORDERS
// =====================================

async function loadOrders() {

  const ordersContainer =
    document.getElementById(
      "adminOrders"
    );


  if (!ordersContainer)
    return;


  ordersContainer.innerHTML =
    "<p>Loading orders...</p>";


  const {
    data,
    error
  } =
    await supabaseClient
      .from("orders")
      .select(`
        *,
        products (
          title,
          image_url
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    ordersContainer.innerHTML = `

      <p style="color:red;">
        ❌ ${escapeHTML(
          error.message
        )}
      </p>

    `;

    return;

  }


  if (
    !data ||
    data.length === 0
  ) {

    ordersContainer.innerHTML = `

      <div
        style="
          padding:25px;
          text-align:center;
        "
      >

        <h3>
          No orders yet
        </h3>

        <p>
          Customer orders will appear here.
        </p>

      </div>

    `;

    return;

  }


  ordersContainer.innerHTML =
    data
      .map(
        order => {

          const product =
            order.products || {};


          const status =
            order.payment_status ||
            "pending";


          const statusHTML =
            status === "paid"

              ? `
                <span
                  style="
                    color:green;
                    font-weight:bold;
                  "
                >
                  🟢 PAID
                </span>
              `

              : status === "rejected"

              ? `
                <span
                  style="
                    color:red;
                    font-weight:bold;
                  "
                >
                  🔴 REJECTED
                </span>
              `

              : `
                <span
                  style="
                    color:#b45309;
                    font-weight:bold;
                  "
                >
                  🟡 PENDING
                </span>
              `;


          return `

            <div
              style="
                padding:20px;
                margin-bottom:15px;
                border:1px solid #ddd;
                border-radius:15px;
                background:#fff;
              "
            >

              <div
                style="
                  display:flex;
                  gap:20px;
                  flex-wrap:wrap;
                "
              >

                ${
                  product.image_url
                    ? `
                      <img
                        src="${product.image_url}"
                        alt="${escapeHTML(
                          product.title ||
                          "Product"
                        )}"
                        style="
                          width:120px;
                          height:80px;
                          object-fit:cover;
                          border-radius:10px;
                        "
                      >
                    `
                    : ""
                }


                <div>

                  <h3>
                    ${escapeHTML(
                      product.title ||
                      "Unknown Product"
                    )}
                  </h3>


                  <p>
                    <strong>
                      Order ID:
                    </strong>

                    ${escapeHTML(
                      order.order_id
                    )}
                  </p>


                  <p>
                    <strong>
                      Customer:
                    </strong>

                    ${escapeHTML(
                      order.customer_name
                    )}
                  </p>


                  <p>
                    <strong>
                      Email:
                    </strong>

                    ${escapeHTML(
                      order.customer_email
                    )}
                  </p>


                  <p>
                    <strong>
                      Amount:
                    </strong>

                    $${Number(
                      order.amount || 0
                    ).toFixed(2)}
                  </p>


                  <p>
                    <strong>
                      Transaction ID:
                    </strong>

                    ${
                      order.transaction_id
                        ? escapeHTML(
                            order.transaction_id
                          )
                        : "Not provided"
                    }

                  </p>


                  <p>
                    <strong>
                      Payment:
                    </strong>

                    ${statusHTML}

                  </p>


                  <p>
                    <strong>
                      Order Status:
                    </strong>

                    ${escapeHTML(
                      order.order_status ||
                      "pending"
                    )}

                  </p>


                  <p>
                    <strong>
                      Date:
                    </strong>

                    ${formatDate(
                      order.created_at
                    )}

                  </p>


                  ${
                    status === "pending"
                      ? `

                        <div
                          style="
                            display:flex;
                            gap:10px;
                            flex-wrap:wrap;
                            margin-top:15px;
                          "
                        >

                          <button
                            type="button"
                            onclick="
                              markOrderPaid(
                                ${order.id}
                              )
                            "
                          >
                            ✅ Mark as Paid
                          </button>


                          <button
                            type="button"
                            onclick="
                              rejectOrder(
                                ${order.id}
                              )
                            "
                          >
                            ❌ Reject
                          </button>

                        </div>

                      `
                      : ""
                  }


                  ${
                    status === "paid"
                      ? `

                        <div
                          style="
                            margin-top:15px;
                            padding:12px;
                            background:#ecfdf5;
                            border-radius:10px;
                          "
                        >

                          ✅ Payment verified.

                          <br>

                          Product can now be delivered
                          to the customer.

                        </div>

                      `
                      : ""
                  }

                </div>

              </div>

            </div>

          `;

        }
      )
      .join("");

}


// =====================================
// MARK ORDER PAID
// =====================================

async function markOrderPaid(
  orderId
) {

  if (
    !confirm(
      "Confirm that you received this payment?"
    )
  ) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("orders")
      .update({

        payment_status:
          "paid",

        order_status:
          "paid"

      })
      .eq(
        "id",
        orderId
      );


  if (error) {

    alert(
      "Error: " +
      error.message
    );

    return;

  }


  await loadOrders();


  alert(
    "✅ Order marked as PAID."
  );

}


// =====================================
// REJECT ORDER
// =====================================

async function rejectOrder(
  orderId
) {

  if (
    !confirm(
      "Reject this payment/order?"
    )
  ) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("orders")
      .update({

        payment_status:
          "rejected",

        order_status:
          "rejected"

      })
      .eq(
        "id",
        orderId
      );


  if (error) {

    alert(
      "Error: " +
      error.message
    );

    return;

  }


  await loadOrders();


  alert(
    "Order rejected."
  );

}


// =====================================
// DELETE PRODUCT
// =====================================

async function deleteProduct(
  id
) {

  if (
    !confirm(
      "Delete this product?"
    )
  ) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
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
// REFRESH PRODUCTS
// =====================================

refreshProducts?.addEventListener(
  "click",
  loadProducts
);


// =====================================
// HELPERS
// =====================================

function cleanFileName(
  name
) {

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


function createSlug(
  text
) {

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


function escapeHTML(
  value
) {

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


function formatDate(
  value
) {

  if (!value) {

    return "Unknown";

  }


  return new Date(
    value
  ).toLocaleString();

}
