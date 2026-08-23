import { Client as ClientSchema } from "../schemas/client.schema";
import { Rider as RiderSchema } from "../schemas/rider.schema";

export class Stats {
  static async getCounts() {
    const [totalClients, totalRiders] = await Promise.all([
      ClientSchema.countDocuments(),
      RiderSchema.countDocuments(),
    ]);

    return { totalClients, totalRiders };
  }
}
