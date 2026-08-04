import re

file_path = r'C:\Users\HP\Desktop\bhumic\Bhumi\BhumiAdmin\src\pages\KYC.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add fields to Land interface
new_land_fields = '''  soilOrganicCarbon: number;
  proofDocumentUrl: string;
  status: 'Pending' | 'Verified' | 'Rejected' | 'Auditing';
  verifiedDate?: string;
  remarks?: string;
  fullAddress?: string | null;
  treeStockCount?: number | null;
  plantationAreaAcres?: number | null;
  agroforestrySpecies?: string | null;
  isIrrigated?: boolean;
  belongsToAnotherPerson?: boolean;
  fathersName?: string | null;
  landmark?: string | null;'''
content = re.sub(r'  soilOrganicCarbon: number;\s*proofDocumentUrl: string;\s*status: \'Pending\' \| \'Verified\' \| \'Rejected\' \| \'Auditing\';\s*verifiedDate\?: string;\s*remarks\?: string;\s*fullAddress\?: string \| null;', new_land_fields, content)

# 2. Add fields to ApiLandVerificationItem
new_api_fields = '''  soil_organic_carbon: number;
  land_document_url?: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'auditing';
  remarks?: string | null;
  verified_date?: string | null;
  tree_stock_count?: number | null;
  plantation_area_acres?: number | null;
  agroforestry_species?: string | null;
  belongs_to_another_person?: boolean;
  fathers_name?: string | null;'''
content = re.sub(r'  soil_organic_carbon: number;\s*land_document_url\?: string \| null;\s*verification_status: \'pending\' \| \'verified\' \| \'rejected\' \| \'auditing\';\s*remarks\?: string \| null;\s*verified_date\?: string \| null;', new_api_fields, content)

# 3. Add fields to apiLandToFrontend mapping
new_mapping = '''    remarks: item.remarks || undefined,
    fullAddress: item.full_address || [item.village, item.tehsil, item.district, item.state].filter(Boolean).join(', ') || 'N/A',
    treeStockCount: item.tree_stock_count,
    plantationAreaAcres: item.plantation_area_acres,
    agroforestrySpecies: item.agroforestry_species,
    isIrrigated: item.is_irrigated,
    belongsToAnotherPerson: item.belongs_to_another_person,
    fathersName: item.fathers_name,
    landmark: item.landmark,
  };'''
content = re.sub(r'    remarks: item\.remarks \|\| undefined,\s*fullAddress: item\.full_address \|\| \[item\.village, item\.tehsil, item\.district, item\.state\]\.filter\(Boolean\)\.join\(\', \'\\) \|\| \'N/A\',\s*\};', new_mapping, content)

# 4. Add UI rendering blocks in the grid
ui_injection = '''
                        <div className="bg-card/50 border border-border p-2">
                          <span className="text-muted-foreground text-[8px] uppercase block mb-1">SOIL TYPE</span>
                          <span className="text-foreground text-[8.5px] font-black">{selectedLand.soilType || 'Unknown'}</span>
                        </div>
                        <div className="bg-card/50 border border-border p-2">
                          <span className="text-muted-foreground text-[8px] uppercase block mb-1">IRRIGATED?</span>
                          <span className="text-foreground text-[8.5px] font-black">{selectedLand.isIrrigated ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="bg-card/50 border border-border p-2">
                          <span className="text-muted-foreground text-[8px] uppercase block mb-1">TREES / SPECIES</span>
                          <span className="text-foreground text-[8.5px] font-black">{selectedLand.treeStockCount || 0} ({selectedLand.agroforestrySpecies || 'None'})</span>
                        </div>
                        <div className="bg-card/50 border border-border p-2">
                          <span className="text-muted-foreground text-[8px] uppercase block mb-1">PLANTATION AREA</span>
                          <span className="text-foreground text-[8.5px] font-black">{selectedLand.plantationAreaAcres || 0} Acres</span>
                        </div>
                        <div className="bg-card/50 border border-border p-2">
                          <span className="text-muted-foreground text-[8px] uppercase block mb-1">OWNERSHIP / FATHER</span>
                          <span className="text-foreground text-[8.5px] font-black">{selectedLand.belongsToAnotherPerson ? 'Other' : 'Self'} / {selectedLand.fathersName || 'N/A'}</span>
                        </div>
                        <div className="bg-card/50 border border-border p-2">
                          <span className="text-muted-foreground text-[8px] uppercase block mb-1">LANDMARK</span>
                          <span className="text-foreground text-[8.5px] font-black">{selectedLand.landmark || 'N/A'}</span>
                        </div>
                        <div className="bg-card/50 border border-border p-2">
                          <span className="text-muted-foreground text-[8px] uppercase block mb-1">ADDRESS</span>
                          <span className="text-foreground text-[8.5px] font-black">{selectedLand.fullAddress || 'N/A'}</span>
                        </div>
'''

content = re.sub(
    r'<div className="bg-card/50 border border-border p-2">\s*<span className="text-muted-foreground text-\[8px\] uppercase block mb-1">SOIL TYPE</span>\s*<span className="text-foreground text-\[8\.5px\] font-black">\{selectedLand\.soilType \|\| \'Unknown\'\}</span>\s*</div>\s*<div className="bg-card/50 border border-border p-2">\s*<span className="text-muted-foreground text-\[8px\] uppercase block mb-1">ADDRESS</span>\s*<span className="text-foreground text-\[8\.5px\] font-black">\{selectedLand\.fullAddress \|\| \'N/A\'\}</span>\s*</div>',
    ui_injection,
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
