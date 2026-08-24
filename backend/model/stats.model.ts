import { Client as ClientSchema } from "../schemas/client.schema";
import { Complaint as ComplaintSchema } from "../schemas/complaint.schema";
import { Rider as RiderSchema } from "../schemas/rider.schema";

export class Stats {
  static async getCounts() {
    const [totalClients, totalRiders, pendingComplaints] = await Promise.all([
      ClientSchema.countDocuments(),
      RiderSchema.countDocuments(),
      ComplaintSchema.countDocuments({ status: { $ne: "Resolved" } }),
    ]);

    return { totalClients, totalRiders, pendingComplaints };
  }
}
