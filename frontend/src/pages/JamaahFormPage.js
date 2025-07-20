import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ModernJamaahForm from '../components/forms/ModernJamaahForm';

const JamaahFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const handleSuccess = () => {
    navigate('/jamaah');
  };

  const handleCancel = () => {
    navigate('/jamaah');
  };

  return (
    <Box>
      {/* Modern Form Component with built-in header */}
      <ModernJamaahForm
        jamaahId={id}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Box>
  );
};

export default JamaahFormPage;