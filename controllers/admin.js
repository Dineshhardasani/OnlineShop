const Product = require('../models/product');
const fileHelper=require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if(!image){
    return res.status(422).render('admin/add-product',{
      pageTitle:'Add Product',
      path:'admin/add-product',
      formsCSS: true,
      productCSS: true,
      activeAddProduct: true
    });
  }
  const imageUrl=image.path;
  const product=new Product({
      title:title,
      price:price,
      description:description,
      imageUrl:imageUrl,
      userId:req.user._id
  });
  product
    .save()
    .then(result=>{
      console.log(result);
      res.redirect('/');
    })
    .catch(err=>{
      res.redirect('/');
      console.log(err);
    });

};

exports.getProducts = (req, res, next) => {
  console.log(req.user._id);
  Product.find({userId:req.user._id})
    //.select('title price -_id')
    //.populate('userId')
    .then(products=>{
      res.render('admin/products',{
        prods:products,
        pageTitle:'Admin Products',
        path:'/admin/products'
      })
  }).catch(err=>{
    console.log(err);
  });
};

exports.postDeleteProduct=(req,res,next)=>{
  const prodId=req.body.productId;
  Product.findById(prodId)
      .then(product=>{
        if(!product){
          return next(new Error('product not find'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id:prodId,userId:req.user._id});
      })
      .then(()=>{
        console.log('DESTROYED PRODUCT');
        res.redirect('/admin/products');
      })
      .catch(err=>{
        console.log(err);
      });
};
exports.getEditProduct=(req,res,next)=>{
  const prodId=req.params.productId;
  Product.findById(prodId)
        .then(product=>{
          if(!product){
            return next(new Error('product not find'));
          }
          return res.render('admin/edit-product',{
            pageTitle:"Edit-Product",
            path:'/edit-product',
            product:product
          });
        })
        .catch(err=>{
          console.log(err);
        })
};
exports.postEditProduct=(req,res,next)=>{
  const prodId=req.params.productId;
  if(!req.file){
  Product.update({_id:prodId},{title:req.body.title,price:req.body.price,description:req.body.description})
        .then(result=> {return res.redirect('http://localhost:3000/'); })
        .catch(err=>{
          console.log(err);
        });
  }
  else{
    Product.update({_id:prodId},{title:req.body.title,imageUrl:req.file.path,price:req.body.price,description:req.body.description})
          .then(result=>{return res.redirect('http://localhost:3000/'); })
          .catch(err=>{
            console.log(err);
          });
  }
}
