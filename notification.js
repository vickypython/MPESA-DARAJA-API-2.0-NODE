const { Schema, model } = require("mongoose");

const notifSchema = new Schema(
  {
    amount: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    trx_id: {
      type: String,
      required: true,
    },
  },
  { timestamp: true }
);
module.export = model("MpesaTutorial", notifSchema);
