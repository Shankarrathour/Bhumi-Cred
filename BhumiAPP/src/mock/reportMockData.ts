export interface LabParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'H' | 'L' | null; // High or Low (relative to carbon baseline)
}

export interface LabSection {
  category: string;
  parameters: LabParameter[];
}

export interface LabReport {
  id: string;
  testName: string;
  date: string;
  farmerName?: string; // Populated at runtime from authenticated user profile
  ageSex: string;      // Mapped to plot acreage / region
  referredBy: string;  // Mapped to Certified Verification Agency
  regNo: string;
  registeredOn: string;
  collectedOn: string; // Mapped to Audit Date
  receivedOn: string;  // Mapped to Satellite Baseline Lock
  reportedOn: string;  // Mapped to Credit Issuance Date
  sections: LabSection[];
  auditorNotes: string; // Mapped to Lead Auditor Notes
  interpretation?: string;
}

export const MOCK_REPORTS_DETAILS: Record<string, LabReport> = {
  'REP-001': {
    id: 'REP-001',
    testName: 'Soil Organic Carbon (SOC) Audit',
    date: '10 May 2026',
    farmerName: undefined,
    ageSex: '4.5 Acres / Sihore, MP',
    referredBy: 'ICAR National Soil Lab',
    regNo: 'BHC-10029',
    registeredOn: '10/05/2026 09:30 AM',
    collectedOn: '10/05/2026 09:45 AM',
    receivedOn: '10/05/2026 11:15 AM',
    reportedOn: '10/05/2026 04:55 PM',
    sections: [
      {
        category: 'SOIL CARBON & METRICS ANALYSIS',
        parameters: [
          { name: 'SOIL ORGANIC CARBON (SOC)', value: '1.45', unit: '%', referenceRange: '1.50 - 2.50', flag: 'L' },
          { name: 'ORGANIC MATTER CONTENT', value: '2.50', unit: '%', referenceRange: '3.00 - 5.00', flag: 'L' },
          { name: 'SOIL NITROGEN (N)', value: '142', unit: 'kg/ha', referenceRange: '280 - 560', flag: 'L' },
          { name: 'SOIL PHOSPHORUS (P)', value: '24.2', unit: 'kg/ha', referenceRange: '22.5 - 55.0' },
          { name: 'SOIL POTASSIUM (K)', value: '312', unit: 'kg/ha', referenceRange: '135 - 340' },
          { name: 'SOIL PH INDEX', value: '6.4', unit: 'pH', referenceRange: '6.0 - 7.5' },
          { name: 'BULK DENSITY', value: '1.32', unit: 'g/cm³', referenceRange: '1.10 - 1.40' },
          { name: 'WATER HOLDING CAPACITY', value: '42.5', unit: '%', referenceRange: '45.0 - 65.0', flag: 'L' },
        ]
      }
    ],
    auditorNotes: 'The soil baseline audit indicates a healthy pH balance, but a critical deficiency in Organic Carbon (1.45% vs 1.5% target) and Nitrogen levels. Initiating a zero-tillage mulch cover program and planting eucalyptus boundary saplings is strongly advised to double carbon sponge density and unlock high-tier carbon credit payouts.',
  },
  'REP-002': {
    id: 'REP-002',
    testName: 'Satellite NDVI & Canopy Audit',
    date: '15 Apr 2026',
    farmerName: undefined,
    ageSex: '4.5 Acres / Sihore, MP',
    referredBy: 'NRSC Remote Sensing Center',
    regNo: 'BHC-10029',
    registeredOn: '15/04/2026 07:30 AM',
    collectedOn: '15/04/2026 07:45 AM',
    receivedOn: '15/04/2026 09:15 AM',
    reportedOn: '15/04/2026 02:30 PM',
    sections: [
      {
        category: 'SATELLITE BIOMASS ANALYTICS',
        parameters: [
          { name: 'NDVI HEALTH INDEX', value: '0.78', unit: 'ratio', referenceRange: '0.70 - 0.90' },
          { name: 'CANOPY FRACTIONAL COVER', value: '44', unit: '%', referenceRange: '35 - 60' },
          { name: 'ACTIVE WOODY BIOMASS', value: '18.4', unit: 'tons/ha', referenceRange: '15.0 - 30.0' },
          { name: 'CARBON STOCK EQUIVALENT', value: '9.2', unit: 'tC/ha', referenceRange: '7.5 - 15.0' },
          { name: 'BIODIVERSITY TREE RATIO', value: '1.2', unit: 'index', referenceRange: '1.5 - 3.0', flag: 'L' },
        ]
      }
    ],
    auditorNotes: 'Sentinel satellite multispectral mapping confirms high vegetative chlorophyll indices (NDVI: 0.78), indicating a highly productive seasonal vegetative density. Boundary canopy woody carbon stock is calculated at 18.4 tons per hectare. Increasing species diversity index by inter-cropping fruit-bearing trees is recommended to enhance biodiversity carbon multipliers.',
  },
  'REP-003': {
    id: 'REP-003',
    testName: 'Agroforestry Biomass Audit',
    date: '12 May 2026',
    farmerName: undefined,
    ageSex: '4.5 Acres / Sihore, MP',
    referredBy: 'BhumiCred Certified Inspector',
    regNo: 'BHC-10029',
    registeredOn: '12/05/2026 08:00 AM',
    collectedOn: '12/05/2026 08:15 AM',
    receivedOn: '12/05/2026 10:00 AM',
    reportedOn: '12/05/2026 03:15 PM',
    sections: [
      {
        category: 'FIELD BIOMASS MEASUREMENT',
        parameters: [
          { name: 'VERIFIED BOUNDARY TREES', value: '30', unit: 'count', referenceRange: '30 - 150' },
          { name: 'MEAN STEM DIAMETER (DBH)', value: '14.2', unit: 'cm', referenceRange: '10.0 - 25.0' },
          { name: 'AVERAGE TREE HEIGHT', value: '8.5', unit: 'meters', referenceRange: '6.0 - 15.0' },
        ]
      }
    ],
    auditorNotes: 'Field carbon verification audit completed successfully. 30 eucalyptus boundary saplings planted during the previous season are thriving with an average stem DBH of 14.2 cm. Survival rate is an exceptional 96.7%, registering them fully into the BhumiCred green family protective ecosystem.',
  }
};
