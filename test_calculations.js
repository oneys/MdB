// Test file to verify the dynamic calculation functions work correctly

// Function to calculate dynamic TRI
const calculateTRI = (project) => {
  const investissement = project.prix_achat_ttc + project.travaux_ttc + project.frais_agence_ttc;
  const benefice = project.prix_vente_ttc - investissement;
  
  if (investissement === 0) return 0;
  
  // Simple TRI calculation (benefice / investissement)
  const tri = benefice / investissement;
  return Math.max(0, Math.min(1, tri)); // Between 0 and 100%
};

// Function to calculate dynamic margin
const calculateMarge = (project) => {
  return project.prix_vente_ttc - project.prix_achat_ttc - project.travaux_ttc - project.frais_agence_ttc;
};

// Test project 1
const testProject1 = {
  prix_achat_ttc: 320000,
  prix_vente_ttc: 485000,
  travaux_ttc: 65000,
  frais_agence_ttc: 12000
};

// Test project 2
const testProject2 = {
  prix_achat_ttc: 425000,
  prix_vente_ttc: 580000,
  travaux_ttc: 85000,
  frais_agence_ttc: 15000
};

console.log("=== Test Project 1 ===");
console.log("Marge:", calculateMarge(testProject1));
console.log("TRI:", (calculateTRI(testProject1) * 100).toFixed(2) + "%");

console.log("\n=== Test Project 2 ===");
console.log("Marge:", calculateMarge(testProject2));
console.log("TRI:", (calculateTRI(testProject2) * 100).toFixed(2) + "%");

// Expected results:
// Project 1: Marge = 485000 - 320000 - 65000 - 12000 = 88000
// Project 1: TRI = 88000 / (320000 + 65000 + 12000) = 88000 / 397000 = 0.2217 = 22.17%

// Project 2: Marge = 580000 - 425000 - 85000 - 15000 = 55000  
// Project 2: TRI = 55000 / (425000 + 85000 + 15000) = 55000 / 525000 = 0.1048 = 10.48%