import React, { useState } from 'react';
import { Box, Paper, Container } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a237e 0%, #0288d1 50%, #00897b 100%)',
      p: 2,
    }}>
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3, backdropFilter: 'blur(10px)' }}>
          {isLogin
            ? <LoginForm onSwitch={() => setIsLogin(false)} />
            : <RegisterForm onSwitch={() => setIsLogin(true)} />
          }
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthPage;
