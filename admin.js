// admin.js

let editingProductId = null;

// ===============================
// ELEMENTS
// ===============================

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");

const adminProducts = document.getElementById("adminProducts");

const logoutBtn = document.getElementById("logoutBtn");
const refreshProducts = document.getElementById("refreshProducts");


// ===============================
// CHECK LOGIN
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  await checkUser();
});

async function checkUser() {
  try {
    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {
      showDashboard();
    } else {
      showLogin();
    }

  } catch (error) {
    console.error("Session error:", error);
    showLogin();
  }
}


// ===============================
// LOGIN
// ===============================

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Logging in...";

    try {

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      loginMessage.textContent = "Login successful.";

      showDashboard();

    } catch (error) {

      console.error(error);

      loginMessage.textContent =
        error.message || "Login failed.";

    }

  });

}


// ===============================
// LOGOUT
// ===============================

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    editingProductId = null;

    showLogin();

  });

}


// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {

  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "none";
  }

}


// ===============================
// SHOW DASHBOARD
// ===============================

async function showDashboard() {

  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "block";
  }

  await loadAdminProducts();

}


// ===============================
// ADD PRODUCT
// ===============================

if (productForm) {

  productForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    productMessage.textContent =
      "Uploading product...";

    try {

      const title =
        document.getElementById("productTitle").value.trim();

      const description =
        document.getElementById("productDescription").value.trim();

      const price =
        Number(document.getElementById("productPrice").value);

      const category =
        document.getElementById("productCategory").value.trim();

      const featured =
        document.getElementById("featuredProduct").checked;

      const imageInput =
        document.getElementById("productImage");

      const fileInput =
        document.getElementById("productFile");


      // ===============================
      // VALIDATION
      // ===============================

      if (!title) {
        throw new Error("Product title is required.");
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid price.");
      }

      if (!fileInput.files.length) {
        throw new Error("Please select the digital product file.");
      }


      // ===============================
      // GET USER
      // ===============================

      const {
        data: { user }
      } = await supabaseClient.auth.getUser();

      if (!user) {
        throw new Error("Please login again.");
      }


      // ===============================
      // UPLOAD IMAGE
      // ===============================

      let imageUrl = null;

      if (imageInput.files.length) {

        const imageFile = imageInput.files[0];

        const imageName =
          `${Date.now()}-${cleanFileName(imageFile.name)}`;

        const imagePath =
          `products/${imageName}`;

        const { error: imageError } =
          await supabaseClient.storage
            .from("product-images")
            .upload(imagePath, imageFile, {
              cacheControl: "3600",
              upsert: false
            });

        if (imageError) {
          throw imageError;
        }

        const { data: imageData } =
          supabaseClient.storage
            .from("product-images")
            .getPublicUrl(imagePath);

        imageUrl = imageData.publicUrl;

      }


      // ===============================
      // UPLOAD DIGITAL FILE
      // ===============================

      const digitalFile =
        fileInput.files[0];

      const fileName =
        `${Date.now()}-${cleanFileName(digitalFile.name)}`;

      const filePath =
        `products/${fileName}`;

      const { error: fileError } =
        await supabaseClient.storage
          .from("digital-products")
          .upload(filePath, digitalFile, {
            cacheControl: "3600",
            upsert: false
          });

      if (fileError) {
        throw fileError;
      }


      // ===============================
      // SAVE PRODUCT
      // ===============================

      const { error: productError } =
        await supabaseClient
          .from("products")
          .insert({

            title: title,

            description: description,

            price: price,

            category: category || null,

            image_url: imageUrl,

            file_path: filePath,

            featured: featured,

            published: true,

            created_at: new Date().toISOString(),

            created_by: user.id

          });

      if (productError) {
        throw productError;
      }


      // ===============================
      // SUCCESS
      // ===============================

      productMessage.textContent =
        "Product added successfully!";

      productForm.reset();

      await loadAdminProducts();

    } catch (error) {

      console.error("Product error:", error);

      productMessage.textContent =
        error.message || "Something went wrong.";

    }

  });

}


// ===============================
// LOAD PRODUCTS
// ===============================

async function loadAdminProducts() {

  if (!adminProducts) return;

  adminProducts.innerHTML =
    "<p>Loading products...</p>";

  try {

    const { data, error } =
      await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (error) throw error;

    if (!data || data.length === 0) {

      adminProducts.innerHTML =
        "<p>No products found.</p>";

      return;
    }

    adminProducts.innerHTML =
      data.map(product => {

        const image =
          product.image_url ||
          "https://via.placeholder.com/300x200?text=Product";

        const title =
          escapeHTML(product.title || "Untitled");

        const description =
          escapeHTML(product.description || "");

        const price =
          Number(product.price || 0).toFixed(2);

        return `

          <div class="admin-product">

            <img
              src="${image}"
              alt="${title}"
              loading="lazy"
            >

            <div class="admin-product-info">

              <h3>${title}</h3>

              <p>${description}</p>

              <strong>
                $${price}
              </strong>

              <div class="admin-product-actions">

                <button
                  onclick="deleteProduct('${product.id}')"
                >
                  Delete
                </button>

              </div>

            </div>

          </div>

        `;

      }).join("");

  } catch (error) {

    console.error(error);

    adminProducts.innerHTML = `
      <p>
        Unable to load products.
      </p>
    `;

  }

}


// ===============================
// DELETE PRODUCT
// ===============================

async function deleteProduct(id) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this product?"
    );

  if (!confirmed) return;

  try {

    const { data: product, error: fetchError } =
      await supabaseClient
        .from("products")
        .select("file_path, image_url")
        .eq("id", id)
        .single();

    if (fetchError) throw fetchError;


    // Delete digital file

    if (product.file_path) {

      await supabaseClient.storage
        .from("digital-products")
        .remove([
          product.file_path
        ]);

    }


    // Delete database product

    const { error } =
      await supabaseClient
        .from("products")
        .delete()
        .eq("id", id);

    if (error) throw error;


    // Reload

    await loadAdminProducts();

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Unable to delete product."
    );

  }

}


// ===============================
// REFRESH
// ===============================

if (refreshProducts) {

  refreshProducts.addEventListener(
    "click",
    loadAdminProducts
  );

}


// ===============================
// HELPERS
// ===============================

function cleanFileName(name) {

  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
