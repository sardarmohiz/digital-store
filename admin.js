// admin.js

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");

const adminProducts = document.getElementById("adminProducts");

const logoutBtn = document.getElementById("logoutBtn");
const refreshProducts = document.getElementById("refreshProducts");


// =====================================
// CHECK LOGIN
// =====================================

document.addEventListener("DOMContentLoaded", async () => {
  await checkLogin();
});


async function checkLogin() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    showDashboard();
  } else {
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

  const { error } =
    await supabaseClient.auth.signInWithPassword({
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

  if (loginSection)
    loginSection.style.display = "block";

  if (dashboardSection)
    dashboardSection.style.display = "none";
}


// =====================================
// SHOW DASHBOARD
// =====================================

async function showDashboard() {

  if (loginSection)
    loginSection.style.display = "none";

  if (dashboardSection)
    dashboardSection.style.display = "block";

  await loadProducts();
}


// =====================================
// ADD PRODUCT
// =====================================

productForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  productMessage.textContent =
    "Uploading product...";

  try {

    const title =
      document.getElementById("productTitle")
        .value.trim();

    const description =
      document.getElementById("productDescription")
        .value.trim();

    const price =
      Number(
        document.getElementById("productPrice").value
      );

    const category =
      document.getElementById("productCategory")
        .value.trim();

    const featured =
      document.getElementById("featuredProduct")
        .checked;

    const imageInput =
      document.getElementById("productImage");

    const fileInput =
      document.getElementById("productFile");


    // =====================================
    // VALIDATION
    // =====================================

    if (!title) {
      throw new Error("Product title is required.");
    }

    if (!Number.isFinite(price)) {
      throw new Error("Enter a valid price.");
    }

    if (!imageInput.files.length) {
      throw new Error("Please select a product image.");
    }

    if (!fileInput.files.length) {
      throw new Error("Please select the digital product file.");
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
      cleanFileName(imageFile.name);


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
            contentType: imageFile.type
          }
        );


    if (imageUploadError) {
      throw new Error(
        "Image upload failed: " +
        imageUploadError.message
      );
    }


    // =====================================
    // GET PUBLIC IMAGE URL
    // =====================================

    const {
      data: imagePublicData
    } =
      supabaseClient.storage
        .from("product-images")
        .getPublicUrl(imagePath);


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
    // DIGITAL FILE UPLOAD
    // =====================================

    const digitalFile =
      fileInput.files[0];

    const filePath =
      "products/" +
      unique +
      "-" +
      cleanFileName(digitalFile.name);


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
            contentType: digitalFile.type
          }
        );


    if (fileUploadError) {

      // Remove image if digital file fails
      await supabaseClient.storage
        .from("product-images")
        .remove([imagePath]);

      throw new Error(
        "Digital file upload failed: " +
        fileUploadError.message
      );
    }


    // =====================================
    // DIGITAL FILE URL
    // =====================================

    const {
      data: filePublicData
    } =
      supabaseClient.storage
        .from("digital-products")
        .getPublicUrl(filePath);


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

          title: title,

          slug: slug,

          description: description,

          price: price,

          category:
            category || "Digital Product",

          image_url: imageUrl,

          file_url: fileUrl,

          featured: featured,

          published: true,

          created_at:
            new Date().toISOString()

        });


    if (databaseError) {

      await supabaseClient.storage
        .from("product-images")
        .remove([imagePath]);

      await supabaseClient.storage
        .from("digital-products")
        .remove([filePath]);

      throw new Error(
        "Database error: " +
        databaseError.message
      );
    }


    // =====================================
    // SUCCESS
    // =====================================

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

});


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
      escapeHTML(error.message) +
      "</p>";

    return;
  }


  if (!data || data.length === 0) {

    adminProducts.innerHTML =
      "<p>No products yet.</p>";

    return;
  }


  adminProducts.innerHTML =
    data.map(product => `

      <div class="admin-product">

        <img
          src="${
            product.image_url ||
            "https://via.placeholder.com/400x250?text=No+Image"
          }"
          alt="${escapeHTML(product.title)}"
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
  } =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);


  if (error) {

    alert(error.message);

    return;
  }


  await loadProducts();
}


// =====================================
// REFRESH
// =====================================

refreshProducts?.addEventListener(
  "click",
  loadProducts
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

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
