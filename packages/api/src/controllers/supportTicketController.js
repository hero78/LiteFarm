/*
 *  Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 *  This file (fertilizerController.js) is part of LiteFarm.
 *
 *  LiteFarm is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  LiteFarm is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details, see <https://www.gnu.org/licenses/>.
 */

// const baseController = require('../controllers/baseController');
const supportTicketModel = require('../models/supportTicketModel');
const userModel = require('../models/userModel');
const { emails, sendEmail } = require('../templates/sendEmailTemplate');

const supportTicketController = {
  // Disabled
  // getSupportTicketsByFarmId() {
  //   return async (req, res) => {
  //     try {
  //       const farm_id = req.params.farm_id;
  //       const result = await supportTicketModel.query().whereNotDeleted().where({ farm_id });
  //       if (!result) {
  //         res.sendStatus(404);
  //       } else {
  //         res.status(200).send(result);
  //       }
  //     } catch (error) {
  //       //handle more exceptions
  //       res.status(400).json({
  //         error,
  //       });
  //     }
  //   };
  // },

  addSupportTicket() {
    return async (req, res) => {
      try {
        const data = JSON.parse(req.body.data);
        data.attachments = [];
        const user_id = req.user.user_id;
        const user = await userModel.query().findById(user_id);
        const result = await supportTicketModel
          .query()
          .context({ user_id })
          .insert(data)
          .returning('*');
        const replacements = {
          first_name: user.first_name,
          support_type: result.support_type,
          message: result.message,
          contact_method: capitalize(result.contact_method),
          contact: result[result.contact_method],
          locale: user.language_preference,
        };
        const email = data.contact_method === 'email' && data.email;
        if (email && email !== user.email) {
          await sendEmail(emails.HELP_REQUEST_EMAIL, replacements, email, {
            sender: 'system@litefarm.org',
            attachments: [req.file],
          });
        } else {
          await sendEmail(emails.HELP_REQUEST_EMAIL, replacements, user.email, {
            sender: 'system@litefarm.org',
            attachments: [req.file],
          });
        }
        res.status(201).send(result);
      } catch (error) {
        console.log(error);
        res.status(400).json({
          error,
        });
      }
    };
  },

  // Disabled
  // patchStatus() {
  //   return async (req, res) => {
  //     const support_ticket_id = req.params.support_ticket_id;
  //     try {
  //       const user_id = req.user.user_id;
  //       const status = req.body.status;
  //       await supportTicketModel
  //         .query()
  //         .context({ user_id })
  //         .findById(support_ticket_id)
  //         .patch({ status });
  //       res.sendStatus(200);
  //     } catch (error) {
  //       res.status(400).json({
  //         error,
  //       });
  //     }
  //   };
  // },
};

const capitalize = (string) => {
  return string[0].toUpperCase() + string.slice(1);
};

module.exports = supportTicketController;
