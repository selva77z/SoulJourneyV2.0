import express from 'express';
import { db } from '../database.js';

const router = express.Router();

// Get all birth data for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    
    // For now, return mock data - will implement database query later
    const birthDataList = await getBirthDataForUser(userId);
    
    res.json({
      success: true,
      data: birthDataList,
      count: birthDataList.length
    });
    
  } catch (error) {
    console.error('Error fetching birth data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new birth data entry
router.post('/', async (req, res) => {
  try {
    const {
      name,
      gender,
      birthDate,
      birthTime,
      birthPlace,
      state,
      country,
      latitude,
      longitude,
      timezone,
      ayanamsa
    } = req.body;
    
    // Validate required fields
    if (!name || !birthDate || !birthTime || !birthPlace) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, birthDate, birthTime, birthPlace'
      });
    }
    
    const userId = req.user?.id || 'anonymous';
    
    // Create birth data entry
    const birthDataEntry = {
      userId,
      name,
      gender: gender || 'not-specified',
      birthDate,
      birthTime,
      birthPlace,
      state: state || '',
      country: country || 'India',
      latitude: parseFloat(latitude) || 10.3833, // Default to Pudukkottai
      longitude: parseFloat(longitude) || 78.8167,
      timezone: timezone || '+05:30',
      ayanamsa: ayanamsa || 'kp-newcomb',
      createdAt: new Date().toISOString()
    };
    
    // Save to database (mock implementation for now)
    const savedEntry = await saveBirthDataToDatabase(birthDataEntry);
    
    res.json({
      success: true,
      data: savedEntry,
      message: `Birth data saved for ${name}`
    });
    
  } catch (error) {
    console.error('Error saving birth data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific birth data entry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    const birthData = await getBirthDataById(id, userId);
    
    if (!birthData) {
      return res.status(404).json({
        success: false,
        error: 'Birth data not found'
      });
    }
    
    res.json({
      success: true,
      data: birthData
    });
    
  } catch (error) {
    console.error('Error fetching birth data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update birth data entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';
    const updateData = req.body;
    
    const updatedEntry = await updateBirthData(id, userId, updateData);
    
    res.json({
      success: true,
      data: updatedEntry,
      message: 'Birth data updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating birth data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete birth data entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    await deleteBirthData(id, userId);
    
    res.json({
      success: true,
      message: 'Birth data deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting birth data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Database functions (mock implementations - will be replaced with real DB)
async function getBirthDataForUser(userId) {
  // Mock data for now
  return [
    {
      id: 1,
      name: 'Selvapriyan',
      birthDate: '1990-11-25',
      birthTime: '03:17:00',
      birthPlace: 'Pudukkottai, Tamil Nadu, India',
      ayanamsa: 'kp-newcomb',
      createdAt: new Date().toISOString()
    }
  ];
}

async function saveBirthDataToDatabase(data) {
  // Mock save - return data with ID
  return {
    id: Date.now(),
    ...data
  };
}

async function getBirthDataById(id, userId) {
  // Mock fetch by ID
  return {
    id: parseInt(id),
    name: 'Selvapriyan',
    birthDate: '1990-11-25',
    birthTime: '03:17:00',
    birthPlace: 'Pudukkottai, Tamil Nadu, India',
    userId
  };
}

async function updateBirthData(id, userId, updateData) {
  // Mock update
  return {
    id: parseInt(id),
    ...updateData,
    updatedAt: new Date().toISOString()
  };
}

async function deleteBirthData(id, userId) {
  // Mock delete
  console.log(`Deleted birth data ${id} for user ${userId}`);
  return true;
}

export default router;