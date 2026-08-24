import { Coordinates as CoordinatesSchema } from "../schemas/coordinates.schema";
import type { UpsertCoordinatesInput } from "../schemas/coordinates.zod";

export class Coordinates {
  static async getByClientId(clientId: string) {
    return CoordinatesSchema.findOne({ clientId }).lean();
  }

  static async upsertForClient(clientId: string, input: UpsertCoordinatesInput) {
    const coordinates = await CoordinatesSchema.findOneAndUpdate(
      { clientId },
      { $set: input },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return coordinates.toObject();
  }
}
