import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BlockUI, NgBlockUI} from 'ng-block-ui';
import {Modal, OneButtonPreset} from 'angular2-modal/plugins/bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {DialogRef} from 'angular2-modal';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import {ICompany, IInterface, IUnrecognizedMessage} from '../../services/models';
import {UnrecognizedMessageService} from '../../services/UnrecognizedMessage.service';
import {CompanyService} from '../../services/company.service';
import {AuthService} from '../../../auth/auth.service';
import {InterfaceService} from '../../services/interface.service';
import {TotalsMessageService} from '../../services/totals-message.service';

export interface ITotalsParameters {
  company_id: number;
  account_id: number;
  interface_id: string;
  type_id: number;
  start_date: moment.Moment;
  end_date: moment.Moment;
}


@Component({
  selector: 'app-totalsmessage',
  templateUrl: './totalsmessage.component.html',
  styleUrls: ['./totalsmessage.component.scss'],
  providers: [CompanyService, InterfaceService, TotalsMessageService, UnrecognizedMessageService]
})
export class TotalsmessageComponent implements OnInit {

  id=0;
  description;
  valForm: FormGroup;
  @BlockUI() blockUI: NgBlockUI;
  companies: Array<ICompany> = [];
  interfaces: Array<IInterface> = [];
  totals: Array<any> = [];
  totals_export: Array<any> = [];

  constructor(
  			  private translate: TranslateService,
              private TotalsMessageService: TotalsMessageService,
              private companyService: CompanyService,
              private interfaceService: InterfaceService,
              private fb: FormBuilder,
              private router: Router,
              private authService: AuthService,
              private modal: Modal)  {

    this.valForm = fb.group({
      'company_id': [null, [Validators.required]],
      'interface_id': [null, [Validators.nullValidator]],
      'type_id': [null, [Validators.nullValidator]],
      'start_date': [null, [Validators.nullValidator]],
      'end_date': [null, [Validators.nullValidator]],
    });
  }

  ngOnInit() {
      if (this.authService.loggedIn()) {
      this.loadInitial();
    } else {
      this.sessionOff();
    }
  }

  private loadInitial(): void {
    this.blockUI.start(this.translate.instant('global.general.loading'));

    if (this.authService.isSuperUser()) {
      this.companyService
        .findAllEnabled()
        .subscribe(
          (companies: Array<ICompany>) => {
            this.companies = companies
            this.interfaceService
              .findAllEnabled()
              .subscribe(
                (interfaces: Array<IInterface>) => {
                  this.interfaces = interfaces;
                  this.blockUI.stop();
                },
                () => {
                  this.blockUI.stop();
                }
              );
          },
          (error) => {
            this.blockUI.stop();
          }
        );
    } else {
      this.companies = this.authService.getCompanies();
      this.blockUI.stop();
    }
  }

    private sessionOff(): void {
    this.modal.alert()
      .showClose(false)
      .title(this.translate.instant('global.general.errors.on_session_expired_title'))
      .message(this.translate.instant('global.general.errors.on_session_expired_message'))
      .open().then(
      (dialog: DialogRef<OneButtonPreset>) => {
        dialog.close();
        this.router.navigate(['/login']);
      }
    );
  };

    submit($event, parameters: ITotalsParameters): void {
    $event.preventDefault();

    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));
      this.TotalsMessageService
          .findByCompany(parameters.company_id, parameters.interface_id, parameters.type_id, parameters.end_date, parameters.start_date)
          .subscribe(
            (totals: Array<any>) => {
              this.totals  = totals;
              this.blockUI.stop();
              console.log(this.totals);
            },
            (error) => {
              this.blockUI.stop();
            }
          );

    } else {
      this.sessionOff();
    }
  }


}
