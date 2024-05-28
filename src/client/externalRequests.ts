import axios from 'axios';
import log4js from 'log4js';

const logger = log4js.getLogger();

const CAR_SERVICE_BASE_URL = 'http://localhost:8080';

export const checkCarExists = async (carId: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${CAR_SERVICE_BASE_URL}/api/car/${carId}`);
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      logger.error(`Failed to check car existence: ${error.message}`);
    } else {
      logger.error('Non-HTTP error occurred during car existence check');
    }
    return false;
  }
};

