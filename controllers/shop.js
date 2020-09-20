const Product = require('../models/product');
const Order = require('../models/order');
const fs=require('fs');
const path=require('path');
const PDFDocument=require('pdfkit');

const ITEMS_PER_PAGE=1;
/*const cart=require('../models/product');
const cartItem=require('../models/cart-item');
const Order=require('../models/order');
exports.getProducts = (req, res, next) => {
  Product.findAll().then(products=>{
    res.render('shop/product-list',{
      prods:products,
      pageTitle:'Shop',
      path:'/'
    })
  }).catch(err=>{
    console.log(err);
  });
};*/

exports.getProduct=(req,res,next)=>{
  const prodId=req.params.productId;
  console.log(prodId);
  Product.findById(prodId)
  .then(products=>{
    res.render('shop/product-detail',{
      product:products,
      pageTitle:products.title,
      path:"/products",
      isAuthenticated: false
    });
  })
  .catch(err=>console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page=+req.query.page || 1;
  let totalItems;
  Product.find().countDocuments().then(numProducts=>{
    totalItems=numProducts;
    return Product.find()
      .skip((page-1)*ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .then(products=>{
        res.render('shop/index',{
          prods:products,
          pageTitle:'Shop',
          path:'/',
          currentPage:page,
          hasNextPage:ITEMS_PER_PAGE*page<totalItems,
          hasPreviousPage:page>1,
          nextPage:page+1,
          previousPage:page-1,
          lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
        });
      })
  })
  .catch(err=>{
    console.log(err);
  });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
      .then(user=>{
        console.log(user.cart.items);
        const products=[...user.cart.items];
        res.render('shop/cart',{
          path:'/cart',
          pageTitle:'Your Cart',
          products:products,
          isAuthenticated: req.session.isLoggedIn,
          csrfToken:req.csrfToken()
        });
      })
      .catch(
        err=>console.log(err)
      );
};

exports.postCart=(req,res,next)=>{
  const prodId=req.body.productId;
  Product.findById(prodId).then(product=>{
    return req.user.addToCart(product);
  }).then(result=>{
    res.redirect('/cart');
  }).catch(err=>console.log(err));
  /*console.log(prodId);
  let fetchedCart;
  req.user
    .getCart()
    .then(cart=>{
      fetchedCart=cart;
      return cart.getProducts({where:{id:prodId}});
    })
    .then(products=>{
      let product;
      if(products.length>0){
        product=products[0];
      }
      let newQuantity=1;
      if(product){
        const oldQuantity=product.cartItem.quantity;
        newQuantity=oldQuantity+1;
        return fetchedCart.addProduct(product,{through:{quantity:newQuantity}});
      }
      return Product.findOne({where:{id:prodId}})
        .then(product=>{
          return fetchedCart.addProduct(product,{through:{quantity:newQuantity}});
        })
        .catch(err=>console.log(err));
    })
    .then(data=>
       res.redirect('/cart')
    )
    .catch(
      err=>console.log(err)
    );*/
};

exports.postCartDeleteProduct=(req,res,next)=>{
  const prodId=req.body.productId;
  req.user
      .removeFromCart(prodId)
      .then(result=>res.redirect('/cart')).catch(err=>console.log(err));
  /*req.user
    .getCart()
    .then(cart=>{
      return cart.getProducts({where: {id:prodId}});
    })
    .then(products=>{
      const product=products[0];
      return product.cartItem.destroy();
    })
    .then(result=>{
      res.redirect('/cart');
    })
    .catch(err=>console.log(err));*/
}

exports.postOrder=(req,res,next)=>{
  let fetchedCart;
  req.user.populate('cart.items.productId')
  .execPopulate()
  .then(user=>{
      console.log(user.cart.items);
      const products=user.cart.items.map(i=>{
        return {quantity:i.quantity,productData:{...i.productId._doc}};
      });
      const order=new Order({
        user:{
          email:req.user.email,
          userId:req.user
        },
        products:products
      });
      return order.save();
    })
    .then(result=>{
      return req.user.clearCart();
      res.redirect('/orders');
    })
    .then(()=>{
      res.redirect('/orders');
    })
    .catch(err=>console.log(err));


  //req.user.addOrder().then(()=>res.redirect('/orders')).catch(err=>console.log(err));
    /*.then(cart=>{
      fetchedCart=cart;
      return cart.getProducts();
    })
    .then(products=>{
      return req.user.createOrder()
      .then(order=>{
        return order.addProducts(products.map(product=>{
          product.orderItem={quantity:product.cartItem.quantity};
          return product;
        }));
      })
      .catch(err=>{
          console.log(err);
        });
    })
    .then(result=>{
      return fetchedCart.setProducts(null);
    })
    .then(result=>{
      res.redirect('/orders');
    })
    .catch(err=>console.log(err));*/
};
exports.getOrders = (req, res, next) => {
  Order.find({"user.userId":req.user._id}).then(orders=>{
    console.log(orders);
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders:orders,
      isAuthenticated: req.session.isLoggedIn
    });
  })
  .catch(err=> console.log(err));

};

exports.getInvoice=(req,res,next)=>{
  const orderId=req.params.orderId;
  Order.findById(orderId).then(order=>{
    if(!order){
      return next(new Error('No order found.'));
    }
    if(order.user.userId.toString()!==req.user._id.toString()){
      return next(new Error('Unauthorized'));
    }
    const invoiceName='invoice-'+orderId+'.pdf';
    const invoicePath=path.join('data','invoices',invoiceName);
    const pdfDoc=new PDFDocument();
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice',{
      underline:true
    });

    pdfDoc.text('------------------------');
    let totalPrice=0;
    order.products.forEach(prod=>{
      totalPrice=totalPrice+prod.quantity*prod.productData.price;
      pdfDoc.text(prod.productData.title+'-'+prod.quantity+'x'+prod.productData.price);
    });
    pdfDoc.text('Total Price'+'-  &'+totalPrice);
    pdfDoc.end();
    //fs.readFile(invoicePath,(err,data)=>{
    //  if(err){
    //    return next(err);
    //  }
    //  res.setHeader('Content-Type','application/pdf');
    //  res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"');
    //  res.send(data);
    //});
    //const file=fs.createReadStream(invoicePath);
    //
    //file.pipe(res);
    //}).catch(err=>{
    //  console.log(err);
  });

}
