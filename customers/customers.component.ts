import {Component, OnInit} from '@angular/core';
import {ICompany, ICustomer} from "../../services/models";
import {FormGroup, FormBuilder, Validators, FormArray} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {DialogRef} from 'angular2-modal';
import {NgBlockUI, BlockUI} from 'ng-block-ui';
import {Router} from '@angular/router';
import {AuthService} from '../../../auth/auth.service';
import {OneButtonPreset, Modal, TwoButtonPreset} from 'angular2-modal/plugins/bootstrap';
import {CompanyService} from "../../services/company.service";
import {CustomerService} from "../../services/customer.service";
import * as moment from 'moment';

export interface ICustomerParameter {
  company_id: number;
  status: string;
  start_date?: moment.Moment;
  end_date?: moment.Moment;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  providers: [CustomerService, CompanyService, Modal]
})
export class CustomersComponent implements OnInit {

  valForm: FormGroup;
  @BlockUI() blockUI: NgBlockUI;
  customers: Array<ICustomer> = [];
  companies: Array<ICompany> = [];

  constructor(
    private customerService: CustomerService,
    private translate: TranslateService,
    private companyService: CompanyService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private modal: Modal
  ) {

    this.valForm = fb.group({
      'company_id': [null, [Validators.required]],
      'status': [null, [Validators.required]],
      'start_date': [null, [Validators.nullValidator]],
      'end_date': [null, [Validators.nullValidator]],
    });
  }

  ngOnInit() {
    console.log('Initialize summary awt component');

    if (this.authService.loggedIn()) {
      this.loadCompany();
    } else {
      this.sessionOff();
    }

  }

  submit($event, parameters: ICustomerParameter): void {

    $event.preventDefault();

    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));

      this.customerService
        .searchByCompany(parameters.company_id, null, parameters.status, parameters.end_date, parameters.start_date)
        .subscribe(
          (customers: Array<ICustomer>) => {
            this.customers  = customers;
            this.blockUI.stop();
          },
          (error) => {
            this.blockUI.stop();
          }
        );

    } else {
      this.sessionOff();
    }

  }


  private loadCompany(): void {
    this.blockUI.start(this.translate.instant('global.general.loading'));

    if (this.authService.isSuperUser()) {
      this.companyService
        .findAllEnabled()
        .subscribe(
          (companies: Array<ICompany>) => {
            this.companies = companies;
            this.blockUI.stop();
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
  }

}
