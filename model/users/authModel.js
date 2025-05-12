import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    phoneNumber: String,
    isAddressDefault: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is Required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is Required"]
    },
    fullname: {
        type: String,
        required: [true, 'Full Name is Required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: ['user', 'admin'],
        default: 'user'
    },
    addresses: {
        type: [addressSchema],
        required: false,
        default: undefined
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        }
    }]
}, {
    timestamps: true,
    strict: true
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Login method
userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error('Incorrect email');
    }
    
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
        throw new Error('Incorrect password');
    }
    
    return user;
};

// Ensure no index is created on addresses.phoneNumber
userSchema.set('autoIndex', false);

// Only create index for email
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

// Explicitly create only the email index
User.createIndexes().catch(console.error);

export default User;