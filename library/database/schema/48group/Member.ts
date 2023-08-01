import { Schema, model } from 'mongoose'

const memberSchema = new Schema<Database.I48Member>({
  name: {
    type: String,
    required: true,
  },
  kanji: {
    type: String,
  },
  isGraduate: {
    type: Boolean,
    required: true,
  },
  group: {
    type: String,
  },
  description: {
    type: String,
  },
  img: {
    type: String,
  },
  stage48: {
    type: String,
  },
  banner: {
    type: String,
  },
  jikosokai: {
    type: String,
  },
  generation: String,
  socials: {
    type: [
      {
        title: String,
        url: String,
      },
    ],
    default: [],
  },
  birthdate: {
    type: Date,
  },
  showroom_id: Number,
})

memberSchema.virtual('showroom', {
  ref: 'Showroom',
  localField: 'showroom_id',
  foreignField: 'room_id',
  justOne: true,
})

export default model<Database.I48Member>(
  'Member',
  memberSchema,
)
