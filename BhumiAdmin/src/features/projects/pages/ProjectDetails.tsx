import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Button } from '@mui/material';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors } from '../../../theme/colors';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} className="py-6" {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const project = {
    id: id || 'PRJ-8001',
    name: 'Gujarat Afforestation Phase 1',
    status: 'Active',
    area: '14,000 acres',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <StatusBadge status="success" label={project.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{project.id} • Total Area: {project.area}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" color="primary">Generate Report</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Timeline & Milestones" />
          <Tab label="Farmers" />
          <Tab label="Government" />
          <Tab label="Partners" />
          <Tab label="MRV Operations" />
          <Tab label="GIS Maps" />
          <Tab label="Carbon Credits" />
          <Tab label="Revenue" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography color="text.secondary">Project Overview & Dashboard.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">Project Timeline & Milestones tracking.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <Typography color="text.secondary">Farmers enrolled in this project.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={3}>
        <Typography color="text.secondary">Government organizations involved.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={4}>
        <Typography color="text.secondary">Partners (Carbon, Insurance, etc.) involved.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={5}>
        <Typography color="text.secondary">MRV Data and Sensor inputs.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={6}>
        <Typography color="text.secondary">GIS and satellite imagery.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={7}>
        <Typography color="text.secondary">Carbon Credits generated and issued.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={8}>
        <Typography color="text.secondary">Revenue tracking and distribution.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={9}>
        <Typography color="text.secondary">Project Audit Reports and Logs.</Typography>
      </CustomTabPanel>
    </div>
  );
};
