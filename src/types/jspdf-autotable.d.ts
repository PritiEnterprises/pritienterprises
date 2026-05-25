declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";
  function autoTable(doc: jsPDF, options: Record<string, unknown>): jsPDF;
  export default autoTable;
}
