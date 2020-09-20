const Product=require('../models/product');
exports.getAddProduct=(req,res,next)=>{
  res.render('admin/add-product',{
    pageTitle:'Add Product',
    path: '/admin/add-product',
    formsCSS:true,
    productCSS:true,
    activeAddProduct:true
  });
};

exports.postAddProduct=(req,res,next)=>{
  const product=new Product(req.body.title);
  product.save();
  res.redirect('/');
};

exports.get=(req, res, next) => {
  Product.fetchAll(products=>{
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      hasProducts: products.length > 0,
      activeShop: true,
      productCSS: true,
      layout:false
    });
  });
};

exports.getCart=(req,res,next)=>{
  res.render('shop/cart',{

  });
};

exports.getProducts=(req,res,next)=>{
  res.render('admin/products',{

  });
};

exports.getProductList=(req,res,next)=>{
  res.render('shop/product-list',{
    pageTitle:'Product List',
    path:'/products'
  });
};
