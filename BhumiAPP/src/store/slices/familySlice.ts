import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'Wife' | 'Son' | 'Daughter' | 'Husband' | 'Father' | 'Mother' | 'Other';
  gender: 'male' | 'female' | 'other';
  age?: number;
}

interface FamilyState {
  members: FamilyMember[];
}

const initialState: FamilyState = {
  members: [
    {
      id: 'fam_1',
      name: 'Sarah',
      relation: 'Wife',
      gender: 'female',
      age: 32
    },
    {
      id: 'fam_2',
      name: 'Rahul',
      relation: 'Son',
      gender: 'male',
      age: 8
    }
  ]
};

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    addFamilyMember: (state, action: PayloadAction<FamilyMember>) => {
      state.members.push(action.payload);
    },
    removeFamilyMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter(member => member.id !== action.payload);
    }
  }
});

export const { addFamilyMember, removeFamilyMember } = familySlice.actions;
export default familySlice.reducer;
