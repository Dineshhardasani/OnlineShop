const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const productSchema=new Schema({
  title:{
    type:String,
    required: true
  },
  price:{
    type:Number,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  imageUrl:{
    type:String,
    required:true
  },
  userId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required:true
  }
});
module.exports=mongoose.model('Product',productSchema);



//const getDb=require('../util/database').getDb;
//const mongodb=require('mongodb');
//class Product{
//  constructor(title,price,description,imageUrl,userId){
//    this.title=title;
//    this.price=price;
//    this.description=description;
//    this.imageUrl=imageUrl;
//    this.userId=new mongodb.ObjectId(userId);
//  }
//  save(){
//    const db=getDb();
//    return db.collection('products')
//    .insertOne(this)
//    .then(result=>{console.log(result);})
//    .catch(err=>console.log(err));
//  }
//  static fetchAll(){
//    return getDb().collection('products').find().toArray()
//    .then(products=>
//      {
//        console.log(products);
//        return products;
//      })
//    .catch(err=>{console.log(err)});
//  }
//  static findById(prodId){
//    const db=getDb();
//    return db.collection('products').find({_id:new mongodb.ObjectId(prodId)})
//    .next()
//    .then(product=>
//      {
//        console.log(product);
//        return product;
//      })
//      .catch(err=>
//        console.log(err)
//      );
//  }
//  static deleteById(prodId){
//    const db=getDb();
//    return db.collection('products').deleteOne({_id:new mongodb.ObjectId(prodId)})
//    .then(result=>{
//      console.log('Deleted')
//    })
//    .catch(err=>{
//      console.log(err);
//    });
//  }
//}
//module.exports=Product;
//
