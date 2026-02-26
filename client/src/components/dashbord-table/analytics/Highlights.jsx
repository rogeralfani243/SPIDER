import React from 'react';
import { Card, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

const Highlights = ({ highlights }) => {
  if (!highlights || highlights.length === 0) {
    return <Typography color="text.secondary">No highlights available</Typography>;
  }

  return (
    <>
      {highlights.map((highlight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            variant="outlined"
            sx={{
              mb: 2,
              p: 2,
              borderLeft: `4px solid ${
                highlight.priority === 'high' ? '#4caf50' :
                highlight.priority === 'medium' ? '#ff9800' : '#2196f3'
              }`
            }}
          >
            <Box display="flex" alignItems="center">
              <Typography variant="h4" sx={{ mr: 2 }}>
                {highlight.icon}
              </Typography>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {highlight.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {highlight.description}
                </Typography>
              </Box>
            </Box>
          </Card>
        </motion.div>
      ))}
    </>
  );
};

export default Highlights;