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
    data: {
      session
    }
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


      const unique =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 8);



      // IMAGE

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
        error:
          imageUploadError
      } =
        await supabaseClient.storage
          .from("product-images")
          .upload(
            imagePath,
            imageFile,
            {

              cacheControl:
                "3600",

              upsert:
                false,

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


      const {
        data:
          imagePublicData
      } =
        supabaseClient.storage
          .from("product-images")
          .getPublicUrl(
            imagePath
          );


      const imageUrl =
        imagePublicData.publicUrl;



      // DIGITAL FILE

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
        error:
          fileUploadError
      } =
        await supabaseClient.storage
          .from("digital-products")
          .upload(
            filePath,
            digitalFile,
            {

              cacheControl:
                "3600",

              upsert:
                false,

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


      const {
        data:
          filePublicData
      } =
        supabaseClient.storage
          .from("digital-products")
          .getPublicUrl(
            filePath
          );


      const fileUrl =
        filePublicData.publicUrl;



      // SLUG

      const slug =
        createSlug(title) +
        "-" +
        Date.now();



      // DATABASE

      const {
        error:
          databaseError
      } =
        await supabaseClient
          .from("products")
          .insert({

            title:
              title,

            slug:
              slug,

            description:
              description,

            price:
              price,

            category:
              category ||
              "Digital Product",

            image_url:
              imageUrl,

            file_url:
              fileUrl,

            featured:
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
          databaseError.message
        );

      }


      productMessage.textContent =
        "✅ Product published successfully!";


      productForm.reset();


      await loadProducts();


    } catch (error) {


      console.error(
        error
      );


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

  if (!adminProducts) {

    return;

  }


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
          ascending:
            false
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


  if (!data?.length) {

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
            >

            <h3>
              ${escapeHTML(
                product.title
              )}
            </h3>

            <p>
              ${escapeHTML(
                product.description ||
                ""
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

        `
      )
      .join("");

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
// LOAD ORDERS
// =====================================

async function loadOrders() {

  let ordersContainer =
    document.getElementById(
      "adminOrders"
    );


  if (!ordersContainer) {

    createOrdersSection();

    ordersContainer =
      document.getElementById(
        "adminOrders"
      );

  }


  ordersContainer.innerHTML =
    "<p>Loading orders...</p>";


  const {
    data,
    error
  } =
    await supabaseClient
      .from("orders")
      .select("*")
      .order(
        "created_at",
        {
          ascending:
            false
        }
      );


  if (error) {

    ordersContainer.innerHTML =
      "<p>" +
      escapeHTML(
        error.message
      ) +
      "</p>";

    return;

  }


  if (!data?.length) {

    ordersContainer.innerHTML =
      "<p>No orders yet.</p>";

    return;

  }


  ordersContainer.innerHTML =
    data
      .map(
        order => {

          const paid =
            order.payment_status ===
            "paid";


          return `

            <div
              style="
                border:1px solid #ddd;
                border-radius:14px;
                padding:20px;
                margin-bottom:15px;
              "
            >

              <h3>
                🧾 Order
                ${escapeHTML(
                  order.order_id ||
                  "N/A"
                )}
              </h3>

              <p>
                <strong>
                  Customer:
                </strong>
                ${escapeHTML(
                  order.customer_name ||
                  ""
                )}
              </p>

              <p>
                <strong>
                  Email:
                </strong>
                ${escapeHTML(
                  order.customer_email ||
                  ""
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
                ${escapeHTML(
                  order.transaction_id ||
                  "Not provided"
                )}
              </p>

              <p>
                <strong>
                  Payment:
                </strong>

                ${
                  paid
                    ? "🟢 PAID"
                    : "🟡 PENDING"
                }

              </p>


              ${
                paid

                  ? `

                    <p>
                      <a
                        href="
                          order.html?id=${encodeURIComponent(
                            order.order_id
                          )}
                        "
                        target="_blank"
                      >
                        📥 Open Customer Order Page
                      </a>
                    </p>

                  `

                  : `

                    <button
                      type="button"
                      onclick="
                        markOrderPaid(
                          ${order.id}
                        )
                      "
                      style="
                        padding:10px 16px;
                        cursor:pointer;
                      "
                    >
                      ✅ Mark as Paid
                    </button>

                  `
              }

            </div>

          `;

        }
      )
      .join("");

}



// =====================================
// MARK ORDER AS PAID
// =====================================

async function markOrderPaid(
  id
) {

  if (
    !confirm(
      "Have you verified that the payment was actually received?"
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
          "completed"

      })
      .eq(
        "id",
        id
      );


  if (error) {

    alert(
      "Could not mark as paid:\n\n" +
      error.message
    );

    return;

  }


  alert(
    "✅ Payment marked as paid."
  );


  await loadOrders();

}



// =====================================
// CREATE ORDERS SECTION
// =====================================

function createOrdersSection() {

  const section =
    document.createElement(
      "div"
    );


  section.className =
    "admin-card";


  section.style.marginTop =
    "25px";


  section.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
      "
    >

      <h2>
        🧾 Customer Orders
      </h2>


      <button
        type="button"
        id="refreshOrders"
      >
        Refresh
      </button>

    </div>


    <div id="adminOrders">

      <p>
        Loading orders...
      </p>

    </div>

  `;


  if (dashboardSection) {

    dashboardSection.appendChild(
      section
    );

  }


  document
    .getElementById(
      "refreshOrders"
    )
    ?.addEventListener(
      "click",
      loadOrders
    );

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
