window.ArchiveContext = {

    page: "unknown",

    productId: null,

    productForm: null,

    hasCommerce: false

};

document.addEventListener("DOMContentLoaded", () => {

    const productForm =
        document.querySelector("product-form-component");

    if (productForm) {

        ArchiveContext.page = "product";

        ArchiveContext.productId =
            productForm.dataset.productId;

        ArchiveContext.productForm =
            productForm;

        ArchiveContext.hasCommerce = true;
        ArchiveContext.form =
    productForm.querySelector("form");

ArchiveContext.variantInput =
    productForm.querySelector(
        'input[name="id"]'
    );

ArchiveContext.addToCartButton =
    productForm.querySelector(
        'button[name="add"]'
    );

    } else {

        ArchiveContext.page = "collection";

        ArchiveContext.hasCommerce = false;

    }

    console.log(
        "Archive Context",
        ArchiveContext
    );

});