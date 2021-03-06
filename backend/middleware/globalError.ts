import { getFromContainer } from 'routing-controllers';
import { AuthorizationRequiredError } from 'routing-controllers/error/AuthorizationRequiredError';
import { Request, Response, NextFunction } from 'express';
import { errorRes } from '../utils';
import { createLogger } from '../utils/logger';
import { EmailService } from '../services/email.service';
import CONFIG from '../config';

const logger = createLogger('GlobalError');
const emailService = getFromContainer(EmailService);

export const globalError = (err, req: Request, res: Response, next: NextFunction) => {
	let { message, httpCode } = err;
	message = message || 'Whoops! Something went wrong!';
	httpCode = httpCode || 500;

	// Send an email if error is from server
	if (err.name !== 'MulterError' && httpCode === 500) {
		logger.fatal({
			err,
			req: {
				body: req.body,
				query: req.query
			}
		});
		if (CONFIG.NODE_ENV === 'production')
			emailService
				.sendErrorEmail(err)
				.then(() => logger.info('Email sent'))
				.catch(error => logger.error('Error sending email:', error));
		errorRes(res, httpCode, 'Whoops! Something went wrong!');
	} else {
		if (err instanceof AuthorizationRequiredError) message = 'You must be logged in!';
		logger.error({
			err,
			req: {
				body: req.body,
				query: req.query
			}
		});
		errorRes(res, httpCode, message);
	}
};
