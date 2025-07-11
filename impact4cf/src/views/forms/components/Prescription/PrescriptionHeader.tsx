'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface PrescriptionData {
  uid?: string;
  id?: string;
  name?: string;
  sessionsPerDay?: number | string;
  updatedAt?: string;
  [key: string]: any;
}

interface PrescriptionHeaderProps {
  onLoadPrescription: (prescription: PrescriptionData) => void;
  prescriptionHistory?: PrescriptionData[];
  currentPrescription?: PrescriptionData;
}

export const PrescriptionHeader = ({ 
  onLoadPrescription,
  prescriptionHistory = [],
  currentPrescription
}: PrescriptionHeaderProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (currentPrescription) {
      setSelectedId(getIdFromPrescription(currentPrescription));
    }
  }, [prescriptionHistory, currentPrescription]);

  const getIdFromPrescription = (prescription: PrescriptionData) => {
    return prescription.uid || prescription.id || JSON.stringify(prescription);
  };

  const handlePrescriptionChange = (event: any) => {
    const newId = event.target.value;
    setSelectedId(newId);

    if (newId) {
      const found = prescriptionHistory.find(
        (p) => getIdFromPrescription(p) === newId
      );
      if (found) {
        onLoadPrescription(found);
      }
    }
  };


  const sortedPrescriptions = [...prescriptionHistory].sort((a, b) => {
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });


  const displayPrescriptions =
    sortedPrescriptions.length > 0
      ? sortedPrescriptions
      : [currentPrescription || { name: 'failed', sessionsPerDay: '2' }];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: 'auto',
        gap: '2px'
      }}
    >
      <Select
        value={selectedId || ''}
        onChange={handlePrescriptionChange}
        displayEmpty
        renderValue={(selected) => {
          if (!selected || selected === '') {
            return 'Prescription History';
          }
          const selectedPrescription = displayPrescriptions.find(
            (p) => getIdFromPrescription(p) === selected
          );
          if (selectedPrescription && selectedPrescription.name) {
            return selectedPrescription.name;
          }
          return 'Prescription History';
        }}
        IconComponent={KeyboardArrowDownIcon}
        sx={{
          minWidth: '150px',
          maxWidth: '300px',
          height: '24px',
          fontSize: '0.8rem',
          '& .MuiSelect-select': {
            padding: '4px 6px'
          }
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        }}
      >
        {displayPrescriptions.map((p, index) => {
          const prescriptionId = getIdFromPrescription(p) || index;
          return (
            <MenuItem
              key={prescriptionId}
              value={prescriptionId}
              dense
              disableGutters
              style={{
                padding: '4px 8px',
                backgroundColor: '#ffffff',  
                marginTop: index > 0 ? '2px' : '0px'
              }}
            >
              <div style={{ width: '100%', lineHeight: '1' }}>
                <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                  {p.name || `Prescription ${index + 1}`}
                </Typography>
                <Typography variant="caption" style={{ fontSize: '0.7rem' }}>
                  {p.sessionsPerDay || '0'} sessions per day
                </Typography>
              </div>
            </MenuItem>
          );
        })}
      </Select>
    </Box>
  );
};

export default PrescriptionHeader;