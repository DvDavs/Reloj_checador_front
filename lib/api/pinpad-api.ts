/**
 * API functions for PIN pad check-in functionality
 */

import { getBaseUrl } from '../apiClient';

export interface PinPadRequest {
  tarjeta: number;
}

export interface PinPadResponse {
  code: string;
  type: 'OK' | 'ERROR' | 'INFO';
  message?: string;
  data?: any;
}

/**
 * Submit PIN pad check-in request
 * @param cardNumber - The card number entered by the user
 * @param deviceKey - The device key for authentication
 * @returns Promise with the API response
 */
export const submitPinPadCheckin = async (
  cardNumber: string,
  deviceKey: string
): Promise<PinPadResponse> => {
  const requestBody = {
    tarjeta: parseInt(cardNumber, 10),
  };

  const API_BASE_URL = getBaseUrl();
  console.log('PIN API Request:', {
    url: `${API_BASE_URL}/api/registros/pinpad`,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': deviceKey,
    },
    body: requestBody,
  });

  const response = await fetch(`${API_BASE_URL}/api/registros/pinpad`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': deviceKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    // Try to get the error response body if available
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      // If we can't parse the response, just use the status
    }

    const error = new Error(`HTTP error! status: ${response.status}`);
    (error as any).status = response.status;
    (error as any).body = errorBody;
    throw error;
  }

  return response.json();
};
