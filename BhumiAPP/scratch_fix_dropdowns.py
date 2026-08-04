import re

with open(r'C:\Users\HP\Desktop\bhumic\Bhumi\BhumiAPP\src\components\GlobalSchedulerOverlay.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <View style={[styles.pickerTrigger... with <TouchableOpacity activeOpacity={1} style={[styles.pickerTrigger...
# But only for the location dropdowns. The Crop Selection one is already a TouchableOpacity!

content = content.replace(
    '<View style={styles.pickerTrigger}>',
    '<TouchableOpacity activeOpacity={1} style={styles.pickerTrigger} onPress={() => { setActiveSelectType(\'state\'); setSearchQuery(\'\'); }}>'
)
content = content.replace(
    '<View style={[styles.pickerTrigger, !stateName && styles.pickerTriggerDisabled]}>',
    '<TouchableOpacity activeOpacity={1} style={[styles.pickerTrigger, !stateName && styles.pickerTriggerDisabled]} onPress={() => { if(stateName) { setActiveSelectType(\'district\'); setSearchQuery(\'\'); } }}>'
)
content = content.replace(
    '<View style={[styles.pickerTrigger, !district && styles.pickerTriggerDisabled]}>',
    '<TouchableOpacity activeOpacity={1} style={[styles.pickerTrigger, !district && styles.pickerTriggerDisabled]} onPress={() => { if(district) { setActiveSelectType(\'tehsil\'); setSearchQuery(\'\'); } }}>'
)
content = content.replace(
    '<View style={[styles.pickerTrigger, !tehsil && styles.pickerTriggerDisabled]}>',
    '<TouchableOpacity activeOpacity={1} style={[styles.pickerTrigger, !tehsil && styles.pickerTriggerDisabled]} onPress={() => { if(tehsil) { setActiveSelectType(\'village\'); setSearchQuery(\'\'); } }}>'
)
content = content.replace(
    '<View style={[styles.pickerTrigger, !village && styles.pickerTriggerDisabled]}>',
    '<TouchableOpacity activeOpacity={1} style={[styles.pickerTrigger, !village && styles.pickerTriggerDisabled]} onPress={() => { if(village) { setActiveSelectType(\'gram_panchayat\'); setSearchQuery(\'\'); } }}>'
)

# Replace the closing </View> for those pickerTriggers with </TouchableOpacity>
# This is tricky because there are other </View>s. We should use regex to match the exact block.

def fix_block(block_str, type_str, setter_str, var_str):
    pattern = re.compile(
        r'(<TouchableOpacity activeOpacity=\{1\}.*?>.*?)(</View>)(\s*\{activeSelectType === \'' + type_str + r'\')',
        re.DOTALL
    )
    def repl(m):
        return m.group(1) + '</TouchableOpacity>' + m.group(3)
    
    # Also add the fallback custom entry
    fallback = f'''
                              {{available{var_str}.filter(x => x.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                <TouchableOpacity style={{styles.selectItem}} onPress={{() => {{ {setter_str}(searchQuery || 'Custom'); setActiveSelectType(null); }}}}>
                                  <Text style={{styles.selectItemText}}>Use "{{searchQuery || 'Custom'}}"</Text>
                                </TouchableOpacity>
                              )}}'''
    
    pattern2 = re.compile(
        r'(<ScrollView style=\{\{maxHeight: 150\}\} nestedScrollEnabled=\{true\}>.*?</TouchableOpacity>\s*\)\)\}\s*)(</ScrollView>)',
        re.DOTALL
    )
    
    res1 = pattern.sub(repl, block_str)
    res2 = pattern2.sub(r'\1' + fallback + r'\2', res1)
    return res2

content = fix_block(content, 'state', 'setStateName', 'States')
content = fix_block(content, 'district', 'setDistrict', 'Districts')
content = fix_block(content, 'tehsil', 'setTehsil', 'Tehsils')
content = fix_block(content, 'village', 'setVillage', 'Villages')
content = fix_block(content, 'gram_panchayat', 'setGramPanchayat', 'GPs')

with open(r'C:\Users\HP\Desktop\bhumic\Bhumi\BhumiAPP\src\components\GlobalSchedulerOverlay.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
