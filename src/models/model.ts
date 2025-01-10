import mongoose,{Schema} from 'mongoose';

export interface categories extends Document {
  type: string,
  color: string,
}

export interface Usertype extends Document {
  username: string,
  email: string,
  password: string,
  budget: number
}

// categories => field => ['type', 'color']
const categories_model: Schema<categories> = new mongoose.Schema({
    type: { type: String},
    color: { type: String, default: '#FCBE44' }
})

export interface transaction extends Document {
  name: string,
  type: string,
  amount: number,
  color: string,
  user : Usertype,
  date: Date
}

// transactions => field => ['name', 'type', 'amount', 'date']
const transaction_model : Schema<transaction> = new mongoose.Schema({
    name: { type: String, default: 'Anonymous'},
    type: { type: String},
    amount: { type: Number },
    color : {type : String},
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now}
})



const UserSchema: Schema<Usertype> = new mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    budget: {
        type: Number,
        default: 0
      },
  });

const UserModel =
  (mongoose.models.User as mongoose.Model<Usertype>) ||
  mongoose.model<Usertype>('User', UserSchema);

export default UserModel;

export const Categories=
  (mongoose.models.categories as mongoose.Model<categories>) ||
  mongoose.model<categories>('categories', categories_model);

export const Transaction=
  (mongoose.models.transaction as mongoose.Model<transaction>) ||
  mongoose.model<transaction>('transaction', transaction_model);