export type RiderCategory = "Employee" | "Vendor";

export const RIDER_CATEGORIES: readonly RiderCategory[] = ["Employee", "Vendor"];

export type RiderRecord = {
  id: string;
  name: string;
  phone: string;
  category: RiderCategory;
  username?: string;
  password?: string;
};

export const MOCK_RIDERS: RiderRecord[] = [
  { id: "1", name: "Bilal Ahmed", phone: "0300-1112223", category: "Employee" },
  { id: "2", name: "Hamza Khan", phone: "0321-4445556", category: "Employee" },
  { id: "3", name: "Saif Malik", phone: "0333-7778889", category: "Vendor" },
  { id: "4", name: "Usman Tariq", phone: "0345-1231234", category: "Employee" },
  { id: "5", name: "Fahad Raza", phone: "0312-9879876", category: "Vendor" },
  { id: "6", name: "Ali Hassan", phone: "0301-5556667", category: "Employee" },
];
