import re
with open("app/profile/add-land.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Replace step bar
text = text.replace("Step {currentStep} of 2", "Step {currentStep} of 6")
text = text.replace("{width: `${(currentStep / 2) * 100}%`}", "{width: `${(currentStep / 6) * 100}%`}")

# Replace submit button label
text = text.replace(
    "{currentStep === 1 ? 'Continue / आगे बढ़ें' : 'Add Land / भूमि जोड़ें'}",
    "{currentStep === 6 ? 'Add Land / भूमि जोड़ें' : 'Continue / आगे बढ़ें'}"
)
text = text.replace(
    "name={currentStep === 1 ? \"arrow-right\" : \"check\"}",
    "name={currentStep === 6 ? \"check\" : \"arrow-right\"}"
)

# Extract handleNext
handle_next_pattern = re.compile(r"const handleNext = \(\) => \{[\s\S]*?if \(currentStep < 2\) \{\s*setCurrentStep\(currentStep \+ 1\);\s*\}\s*\};")
new_handle_next = """const handleNext = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setErrors({});
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!isNonEmptyStr(mobileNumber)) { newErrors.mobileNumber = 'Mobile required'; hasError = true; }
    } else if (currentStep === 2) {
      if (!acres) { newErrors.acres = 'Acres required'; hasError = true; }
      if (!isNonEmptyStr(cropSelection)) { newErrors.cropSelection = 'Crop Selection required'; hasError = true; }
      if (!isNonEmptyStr(soilComposition)) { newErrors.soilComposition = 'Soil Composition required'; hasError = true; }
    } else if (currentStep === 3) {
      if (!isNonEmptyStr(stateName)) { newErrors.stateName = 'State required'; hasError = true; }
      if (!isNonEmptyStr(district)) { newErrors.district = 'District required'; hasError = true; }
      if (!isNonEmptyStr(village)) { newErrors.village = 'Village required'; hasError = true; }
      if (!isNonEmptyStr(city)) { newErrors.city = 'City required'; hasError = true; }
      if (!isNonEmptyStr(country)) { newErrors.country = 'Country required'; hasError = true; }
      if (!isNonEmptyStr(gramPanchayat)) { newErrors.gramPanchayat = 'Panchayat required'; hasError = true; }
      if (!isNonEmptyStr(vikashKhand)) { newErrors.vikashKhand = 'Khand required'; hasError = true; }
      if (!isNonEmptyStr(fullAddress)) { newErrors.fullAddress = 'Address required'; hasError = true; }
    } else if (currentStep === 4) {
      if (!geoCoords) { newErrors.geoCoords = 'GPS mapping is required'; hasError = true; }
      if (boundaryPolygon.length < 3) { newErrors.boundary = 'Boundary polygon must have at least 3 points'; hasError = true; }
    } else if (currentStep === 5) {
      if (docStates.landProof !== 'Approved') {
        newErrors.docs = 'Land Proof is mandatory.';
        hasError = true;
      }
    } else if (currentStep === 6) {
      const photosUploaded = ['photo1', 'photo2', 'photo3', 'photo4'].filter(k => docStates[k] === 'Approved').length;
      if (photosUploaded < 2) {
        setErrors({ docs: 'Please upload at least 2 photos of the land.' });
        return;
      }
      submitLand();
      return;
    }

    if (hasError) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      if (firstError && fieldPositions.current[firstError] !== undefined) {
        scrollViewRef.current?.scrollToPosition(0, Math.max(0, fieldPositions.current[firstError] - 20), true);
      }
      return;
    }
    
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };"""
text = handle_next_pattern.sub(new_handle_next, text)

# Replace the two huge JSX steps with our 6 steps.
# We'll locate them by finding exactly the start and end.
start_idx = text.find("{/* STEP 1: Land Details & Address */}")
end_idx = text.find("<TouchableOpacity style={styles.actionBtn}")

if start_idx != -1 and end_idx != -1:
    new_jsx = """
        {/* STEP 1: Farmer Identity Verification */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Identity / पहचान</Text>
            <Text style={styles.subheading}>Confirm identity details for land registration.</Text>

            <View style={styles.formField}>
              <Text style={styles.label}>Are you registering someone else's land?</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity onPress={() => setBelongsToAnother(false)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
                  <MaterialCommunityIcons name={!belongsToAnother ? "radiobox-marked" : "radiobox-blank"} size={22} color={COLORS.primary} />
                  <Text style={{ marginLeft: 8, fontSize: 14 }}>No, it's mine</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBelongsToAnother(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={belongsToAnother ? "radiobox-marked" : "radiobox-blank"} size={22} color={COLORS.primary} />
                  <Text style={{ marginLeft: 8, fontSize: 14 }}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>

            {belongsToAnother && (
              <View style={styles.formField}>
                <Text style={styles.label}>Original Owner / Father's Name</Text>
                <TextInput style={styles.input} placeholder="Name" value={fathersName} onChangeText={setFathersName} />
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} />
              {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
            </View>
          </View>
        )}

        {/* STEP 2: Soil & Crop Eco-metrics */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Eco-Metrics / कृषि विवरण</Text>
            <Text style={styles.subheading}>Enter crop and soil details.</Text>

            <View style={styles.formField} onLayout={(e) => fieldPositions.current['acres'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Total Land Area (Acres) / एकड़ *</Text>
              <TextInput 
                style={[styles.input, errors.acres && styles.inputError]} 
                placeholder="e.g. 4.5"
                keyboardType="numeric" 
                value={acres} 
                onChangeText={setAcres} 
              />
              {errors.acres && <Text style={styles.errorText}>{errors.acres}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Current Crop Selection *</Text>
              <TextInput style={[styles.input, errors.cropSelection && styles.inputError]} placeholder="e.g. Wheat, Rice" value={cropSelection} onChangeText={setCropSelection} />
              {errors.cropSelection && <Text style={styles.errorText}>{errors.cropSelection}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Soil Composition *</Text>
              <TextInput style={[styles.input, errors.soilComposition && styles.inputError]} placeholder="e.g. Black Soil, Red Soil" value={soilComposition} onChangeText={setSoilComposition} />
              {errors.soilComposition && <Text style={styles.errorText}>{errors.soilComposition}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Water Availability (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. Well, Canal" value={waterAvailability} onChangeText={setWaterAvailability} />
            </View>
          </View>
        )}

        {/* STEP 3: Land Details & Address */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Location / स्थान</Text>
            <Text style={styles.subheading}>Enter your land location.</Text>

            <View style={[styles.dualInputsRow, { zIndex: 10 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['country'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Country / देश *</Text>
                <AutocompleteDropdown data={COUNTRIES_LIST} value={country} onChangeText={(val) => { setCountry(val); setStateName(''); setDistrict(''); setCity(''); setErrors(prev => ({ ...prev, country: '' })); }} placeholder="Country" closeTrigger={closeDropdownsTrigger} style={errors.country ? styles.inputError : {}} />
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
              </View>
              <View style={[styles.formField, { flex: 1, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['stateName'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>State / राज्य *</Text>
                <AutocompleteDropdown data={availableStates} value={stateName} onChangeText={(val) => { setStateName(val); setDistrict(''); setCity(''); setErrors(prev => ({ ...prev, stateName: '' })); }} placeholder="State" closeTrigger={closeDropdownsTrigger} style={errors.stateName ? styles.inputError : {}} />
                {errors.stateName && <Text style={styles.errorText}>{errors.stateName}</Text>}
              </View>
            </View>

            <View style={[styles.dualInputsRow, { zIndex: 9 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 9 }]} onLayout={(e) => fieldPositions.current['district'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>District / जिला *</Text>
                <AutocompleteDropdown data={availableDistricts} value={district} onChangeText={(val) => { setDistrict(val); setCity(''); setErrors(prev => ({ ...prev, district: '' })); }} placeholder="District" closeTrigger={closeDropdownsTrigger} style={errors.district ? styles.inputError : {}} />
                {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
              </View>
              <View style={[styles.formField, { flex: 1, zIndex: 9 }]} onLayout={(e) => fieldPositions.current['city'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>City / शहर *</Text>
                <AutocompleteDropdown data={availableCities} value={city} onChangeText={(val) => { setCity(val); setErrors(prev => ({ ...prev, city: '' })); }} placeholder="City" closeTrigger={closeDropdownsTrigger} style={errors.city ? styles.inputError : {}} />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
            </View>

            <View style={[styles.dualInputsRow, { zIndex: 8 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 8 }]} onLayout={(e) => fieldPositions.current['gramPanchayat'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Gram Panchayat / ग्राम पंचायत *</Text>
                <AutocompleteDropdown data={availableGramPanchayats} value={gramPanchayat} onChangeText={(val) => { setGramPanchayat(val); setErrors(prev => ({ ...prev, gramPanchayat: '' })); }} placeholder="Panchayat" closeTrigger={closeDropdownsTrigger} style={errors.gramPanchayat ? styles.inputError : {}} />
                {errors.gramPanchayat && <Text style={styles.errorText}>{errors.gramPanchayat}</Text>}
              </View>
              <View style={[styles.formField, { flex: 1, zIndex: 8 }]} onLayout={(e) => fieldPositions.current['vikashKhand'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Vikash Khand / विकास खंड *</Text>
                <AutocompleteDropdown data={availableVikasKhands} value={vikashKhand} onChangeText={(val) => { setVikashKhand(val); setErrors(prev => ({ ...prev, vikashKhand: '' })); }} placeholder="Vikash Khand" closeTrigger={closeDropdownsTrigger} style={errors.vikashKhand ? styles.inputError : {}} />
                {errors.vikashKhand && <Text style={styles.errorText}>{errors.vikashKhand}</Text>}
              </View>
            </View>

            <View style={[styles.formField, { zIndex: 7 }]} onLayout={(e) => fieldPositions.current['village'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Village / गांव *</Text>
              <AutocompleteDropdown data={availableVillages} value={village} onChangeText={(val) => { setVillage(val); setErrors(prev => ({ ...prev, village: '' })); }} placeholder="Village name" closeTrigger={closeDropdownsTrigger} style={errors.village ? styles.inputError : {}} />
              {errors.village && <Text style={styles.errorText}>{errors.village}</Text>}
            </View>

            <View style={styles.formField} onLayout={(e) => fieldPositions.current['fullAddress'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Full Address / पूरा पता *</Text>
              <TextInput style={[styles.input, { height: 80 }, errors.fullAddress && styles.inputError]} multiline numberOfLines={3} placeholder="Full address" placeholderTextColor="#64748B" value={fullAddress} onChangeText={(val) => { setFullAddress(val); setErrors(prev => ({ ...prev, fullAddress: '' })); }} />
              {errors.fullAddress && <Text style={styles.errorText}>{errors.fullAddress}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Landmark / सीमा चिन्ह</Text>
              <TextInput style={styles.input} placeholder="Near the river, temple, etc." placeholderTextColor="#64748B" value={landmark} onChangeText={setLandmark} />
            </View>
          </View>
        )}

        {/* STEP 4: GPS Mapping */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Satellite Mapping / उपग्रह मानचित्र</Text>
            <Text style={styles.subheading}>Pinpoint your land boundaries using GPS.</Text>
            
            <View style={styles.gpsCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsTitle}>Geo-Boundary Map Ping *</Text>
                <Text style={styles.gpsSub}>
                  {geoCoords && boundaryPolygon.length > 0
                    ? `Map captured with ${boundaryPolygon.length} boundary points`
                    : 'GPS mapping not captured yet'}
                </Text>
                {(errors.geoCoords || errors.boundary) && (
                  <Text style={styles.errorText}>{errors.geoCoords || errors.boundary}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.gpsBtn} onPress={handleFetchGPS} disabled={gpsLoading}>
                {gpsLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <MaterialCommunityIcons name="crosshairs-gps" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: Documents */}
        {currentStep === 5 && (
          <View style={styles.stepCard} onLayout={(e) => fieldPositions.current['docs'] = e.nativeEvent.layout.y}>
            <Text style={styles.heading}>Documents / दस्तावेज़</Text>
            <Text style={styles.subheading}>Upload mandatory proof of the land.</Text>
            {errors.docs && <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.docs}</Text>}

            {renderDocCard({
              key: 'landProof',
              title: 'Land Ownership Proof',
              subtitle: 'Khasra copy or registration proof',
              icon: 'file-document-outline',
              mandatory: true
            })}
            {renderDocCard({
              key: 'soilCard',
              title: 'Soil Health Card',
              subtitle: 'Govt soil testing parameters (Optional)',
              icon: 'sprout-outline'
            })}
          </View>
        )}

        {/* STEP 6: Photos */}
        {currentStep === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Photos / तस्वीरें</Text>
            <Text style={styles.subheading}>Upload 2-4 photos of the land.</Text>
            
            {errors.docs && <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.docs}</Text>}

            <Text style={[styles.label, { marginTop: 10, marginBottom: 10 }]}>Land Photos (Min 2, Max 4) *</Text>

            <View style={styles.dualInputsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderDocCard({ key: 'photo1', title: 'Photo 1', subtitle: 'Corner view', icon: 'camera-outline', mandatory: true, isSquare: true })}
              </View>
              <View style={{ flex: 1 }}>
                {renderDocCard({ key: 'photo2', title: 'Photo 2', subtitle: 'Center view', icon: 'camera-outline', mandatory: true, isSquare: true })}
              </View>
            </View>
            <View style={styles.dualInputsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderDocCard({ key: 'photo3', title: 'Photo 3', subtitle: 'Optional view', icon: 'camera-outline', isSquare: true })}
              </View>
              <View style={{ flex: 1 }}>
                {renderDocCard({ key: 'photo4', title: 'Photo 4', subtitle: 'Optional view', icon: 'camera-outline', isSquare: true })}
              </View>
            </View>
          </View>
        )}

"""
    text = text[:start_idx] + new_jsx + text[end_idx:]

with open("app/profile/add-land.tsx", "w", encoding="utf-8") as f:
    f.write(text)
