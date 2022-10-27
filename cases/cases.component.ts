import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BlockUI, NgBlockUI} from 'ng-block-ui';
import {ICase, ICompany, IInterface, IMessage, IBotMessage, IUserCreate,  IDocumentAttachment, IImageAttachment} from '../../services/models';
import {AuthService} from '../../../auth/auth.service';
import {Modal, OneButtonPreset} from 'angular2-modal/plugins/bootstrap';
import {CompanyService} from '../../services/company.service';
import {TranslateService} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {CaseService} from '../../services/case.service';
import {DialogRef} from 'angular2-modal';
import * as moment from 'moment';
import {InterfaceService} from '../../services/interface.service';
import * as XLSX from 'xlsx';
import { ILightboxItem } from 'app/now/chat/message/message.component';
import { Lightbox } from 'angular2-lightbox';


export interface ICaseParameter {
  company_id: number;
  account_id: number;
  interface_id: string;
  type_id: number;
  start_date: moment.Moment;
  end_date: moment.Moment;
}


@Component({
  selector: 'app-cases',
  templateUrl: './cases.component.html',
  styleUrls: ['./cases.component.scss'],
  providers: [CompanyService, CaseService, InterfaceService, Modal]
})
export class CasesComponent implements OnInit {

  id = 0;
  origin_id = 0;
  /* messages: message[] = [new message('','','','','','','','')]; */
  valForm: FormGroup;
  @BlockUI() blockUI: NgBlockUI;
  companies: Array<ICompany> = [];
  interfaces: Array<IInterface> = [];
  cases: Array<ICase> = [];
  cases_export: Array<ICase> = [];
  messages: Array<IMessage> = [];
  Botmessages: Array<IBotMessage> = [];
  messageAgent: IUserCreate;

  message: IMessage;
  nameFile : Array<string> = [];
  
  constructor(
              private _lightbox: Lightbox,
              private caseService: CaseService,
              private translate: TranslateService,
              private companyService: CompanyService,
              private interfaceService: InterfaceService,
              private fb: FormBuilder,
              private router: Router,
              private authService: AuthService,
              private modal: Modal) {

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
            this.companies = companies;

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

  formatDate(date: string) {
    return moment(date).format('DD/MM/YYYY HH:mm:ss');
  }

  sec_to_time(time) {
      return moment.utc(time*1000).format("HH:mm:ss");
  }

  submit($event, parameters: ICaseParameter): void {
    $event.preventDefault();

    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));

      this.caseService
          .findByCompany(parameters.company_id, parameters.interface_id, parameters.type_id, parameters.end_date, parameters.start_date)
          .subscribe(
            (cases: Array<ICase>) => {
              this.cases  = cases;
              this.blockUI.stop();
            //  console.log('hola', this.cases)
            },
            (error) => {
              this.blockUI.stop();
            }
          );
    } else {
      this.sessionOff();
    }
  }

  public showMessage(channel: number, session: number, interface_id: string, user_created: IUserCreate) {

    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));
      

      this.caseService
          .findBotMessageBySession(channel, session, interface_id)
          .subscribe(
            (message: Array<IBotMessage>) => {
              this.Botmessages = message;
              this.messageAgent = user_created;
              console.log("message : ", this.Botmessages, this.messageAgent);
              this.blockUI.stop();
            },
            (error) => {
              console.log("error : ", error)
              this.blockUI.stop();
            }
          );

    } else {
      this.sessionOff();
    }
    console.log("showMessage")
  }

  public make_message(messages,option) {
      let final = messages.map(function(m) {
        if(option == "Build_messages"){
          if(m.inout=="I"){
            return m.phone_origin+ " [" + moment(m.created).format('HH:mm:ss') + "]" + ": " + String(m.text).replace(/\n|\r\n|\r|\t/gmi, ' ').replace(/[^a-zA-Z0-9]/g,' ');
          }else{
            return "ChatBot"+ " [" + moment(m.created).format('HH:mm:ss') + "]" + ": " + String(m.text).replace(/\n|\r\n|\r|\t/gmi, ' ').replace(/[^a-zA-Z0-9]/g,' ');
          }
        }else{
          return [m.inout,moment(m.created).format('HH:mm:ss')];
        }
      });
      switch (option) {
        case "first_message_client":
          for (let i = 0; i < final.length; i++){
            if(final[i][0]=="I")
              return final[i][1];
          } 
          break;
        case "first_message_bot":
          for (let i = 0; i < final.length; i++){
            if(final[i][0]!="I")
              return final[i][1];
          }
          break;
        case  "hold_time":
          let client = "";
          let bot = "";/*
          for(let t in final){
             
          }*/
          break;
        default:
          return final.join('/////');
      }
      return "";
  }

  removeAccents(value) {
        return value
            .replace(/ñ/gmi, 'n')
            .replace(/á/gmi, 'a')            
            .replace(/é/gmi, 'e')
            .replace(/í/gmi, 'i')
            .replace(/ó/gmi, 'o')
            .replace(/ú/gmi, 'u');
    }

 export (parameters: ICaseParameter) {
    if (this.cases.length == 0){
      this.export_excel(parameters);
    }else{
      let data: Array<any> = this.cases.map( (cs: ICase) => {
     let l_type = '';
     let l_type_client ='';
     let l_vip_code ='';

      if (cs.l_type != null) {
        l_type = cs.l_type
      };

      if (cs.l_type_client != null) {
        l_type_client = cs.l_type_client
      };

      if (cs.l_vip_code != undefined) {
        l_vip_code = cs.l_vip_code
      };
        return {
                  'ID CHAT': cs.id,
                  'CUENTA': cs.account.username,
                  'INTERFAZ': cs.interface.code,
                  'GSM ID USER':'+' + cs.origin_id.substring(0,2) + ' ' +  cs.origin_id.substring(2),
                  //'MENSAJE': this.make_message(cs.messages,"Build_messages").replace(/\n|\r\n|\r|\t/gmi, ' ').replace(/,/gmi, '').replace(/\n/gmi, ' '),
                  'FECHA CREADO': moment(cs.created).format('YYYY-MM-DD'),
                  //'FECHA CREADO': moment(cs.created).format('YYYY-MM-DD'),
                  'HORA': moment(cs.created).format('HH:mm:ss'),
                  'COLA': (cs.step) ? cs.step.name : '',
                  //'Departamento': (cs.department) ? cs.department.name : '',
                  'TIPO': l_type,
                  'INTERACCION': cs.type.parent.name,
                  'TIPO CLIENTE': l_type_client,
                  'VIP CODE': l_vip_code,
                  'SUBTIPO': (cs.type.parent) ? cs.type.name : '',
                  'ASISTIDO POR': '@'+cs.user_created.username+' / '+cs.user_created.first_name+' '+cs.user_created.last_name,
                  //'Cliente': (cs.client) ? '#'+cs.client.id+' / '+cs.client.fullname : '',
                  'REQUERIMIENTO': (cs.about) ? this.removeAccents(cs.about.replace(/,/gmi, '').replace(/\n/gmi, '---')) : '',
                  'RESOLUCION': (cs.resolution) ? this.removeAccents(cs.resolution.replace(/,/gmi, '').replace(/\n/gmi, '---')) : '',
                  'TIEMPO DE CONVERSACION': moment.utc(cs.talk_time*1000).format("HH:mm:ss"),
                  /*'first_message_client': this.make_message(cs.messages,"first_message_client"),
                  'first_message_bot': this.make_message(cs.messages,"first_message_bot"),*/
                  'TIEMPO DE CHAT': moment.utc(cs.hold_time*1000).format("HH:mm:ss"),
                }
      });
      let csvData = this.convertToCSV(data);
      var blob = new Blob(["\ufeff", csvData], {type: 'text/csv'});
      var url = window.URL.createObjectURL(blob);

      if (navigator.msSaveOrOpenBlob){
        navigator.msSaveBlob(blob, 'cases_report.csv');
      } else {
        let a = document.createElement('a');
        a.setAttribute('style', 'display:none;');
        a.href = url;
        a.download = 'cases_report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      window.URL.revokeObjectURL(url);
    }

  }

  export_excel(parameters: ICaseParameter): void {
    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));

      this.caseService
          .findByCompany(parameters.company_id, parameters.interface_id, parameters.type_id, parameters.end_date, parameters.start_date)
          .subscribe(
            (cases: Array<ICase>) => {
              let data: Array<any> = cases.map((cs: ICase) => {
               let l_type = '';
               let l_type_client ='';
               let l_vip_code ='';

                if (cs.l_type != null) {
                  l_type = cs.l_type
                };

                if (cs.l_type_client != null) {
                  l_type_client = cs.l_type_client
                };

                if (cs.l_vip_code != undefined) {
                  l_vip_code = cs.l_vip_code
                };

                return {
                  'ID CHAT': cs.id,
                  'CUENTA': cs.account.username,
                  'INTERFAZ': cs.interface.code,
                  'GSM ID USER':'+' + cs.origin_id.substring(0,2) + ' ' +  cs.origin_id.substring(2),
                  //'MENSAJE': this.make_message(cs.messages,"Build_messages").replace(/\n|\r\n|\r|\t/gmi, ' ').replace(/,/gmi, '').replace(/\n/gmi, ' '),
                  'FECHA CREADO': moment(cs.created).format('DD/MM/YYYY'),
                  //'FECHA CREADO': moment(cs.created).format('YYYY-MM-DD'),
                  
                  'HORA': moment(cs.created).format('HH:mm:ss'),
                  'COLA': (cs.step) ? cs.step.name : '',
                  //'Departamento': (cs.department) ? cs.department.name : '',
                  'TIPO': l_type,
                  'INTERACCION': cs.type.parent.name,
                  'TIPO CLIENTE': l_type_client,
                  'VIP CODE': l_vip_code,
                  'SUBTIPO': (cs.type.parent) ? cs.type.name : '',
                  'ASISTIDO POR': '@'+cs.user_created.username+' / '+cs.user_created.first_name+' '+cs.user_created.last_name,
                  //'Cliente': (cs.client) ? '#'+cs.client.id+' / '+cs.client.fullname : '',
                  'REQUERIMIENTO': (cs.about) ? this.removeAccents(cs.about.replace(/,/gmi, '').replace(/\n/gmi, '---')) : '',
                  'RESOLUCION': (cs.resolution) ? this.removeAccents(cs.resolution.replace(/,/gmi, '').replace(/\n/gmi, '---')) : '',
                  'TIEMPO DE CONVERSACION': moment.utc(cs.talk_time*1000).format("HH:mm:ss"),
                  /*'first_message_client': this.make_message(cs.messages,"first_message_client"),
                  'first_message_bot': this.make_message(cs.messages,"first_message_bot"),*/
                  'TIEMPO DE CHAT': moment.utc(cs.hold_time*1000).format("HH:mm:ss"),
                  }
              });/*
              let tableData = this.convertToTable(data);
              const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableData);
*/
              /* generate workbook and add the worksheet */
  /*            const wb: XLSX.WorkBook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
*/
              /* save to file */
  //            XLSX.writeFile(wb, 'Reporte de Casos.xlsx');
               
       
              const tableData = this.convertToTable(data);
    
              const wb: XLSX.WorkBook = XLSX.utils.book_new();
              const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableData, {raw: true});
              XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

          
              XLSX.writeFile(wb, 'Reporte de casos.xlsx');              
             
              

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

  private convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    var row = "";

    for (var index in objArray[0]) {
      //Now convert each value to string and comma-separated
      row += index + ',';
    }
    row = row.slice(0, -1);
    //append Label row with line break
    str += row + '\r\n';

    for (var i = 0; i < array.length; i++) {
      var line = '';
      for (var index in array[i]) {
        if (line != '') line += ','

        line += array[i][index];
      }
      str += line + '\r\n';
    }
    return str;
  }

  private convertToTable(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var table = document.createElement('table');
    var tableInnerHTML = "<tr><th>ID CHAT</th><th>CUENTA</th><th>INTERFAZ</th><th>GSM ID USER</th><th>FECHA CREADO</th><th>HORA</th><th>COLA</th><th>TIPO</th><th>INTERACCION</th><th>TIPO CLIENTE</th><th>VIP CODE</th><th>SUBTIPO</th><th>ASISTIDO POR</th><th>REQUERIMIENTO</th><th>RESOLUCION</th><th>TIEMPO DE CONVERSACION</th><th>TIEMPO DE CHAT</th></tr>";

    for (var i = 0; i <array.length; i++) {
      var element = "<tr><td>"+array[i]['ID CHAT']+"</td><td>"+array[i]['CUENTA']+"</td><td>" +array[i]['INTERFAZ']+"</td><td>" + array[i]['GSM ID USER'] +"</td><td>" + array[i]['FECHA CREADO'] +"</td><td>" +array[i]['HORA']+"</td><td>" +array[i]['COLA']+"</td><td>" +array[i]['TIPO']+"</td><td>" +array[i]['INTERACCION']+"</td><td>" +array[i]['TIPO CLIENTE']+"</td><td>" +array[i]['VIP CODE']+"</td><td>" +array[i]['SUBTIPO']+"</td><td>" +array[i]['ASISTIDO POR']+"</td><td>" +array[i]['REQUERIMIENTO']+"</td><td>" +array[i]['RESOLUCION']+"</td><td>" +array[i]['TIEMPO DE CONVERSACION']+"</td><td>" +array[i]['TIEMPO DE CHAT']+"</td></tr>";
      tableInnerHTML = tableInnerHTML.concat(element);
    }
    //console.log('html', tableInnerHTML );
    table.innerHTML = tableInnerHTML;
    return table;
  }
  
  getImages(): Array<ILightboxItem> {
    return this.message.attachments.filter((attch) => {
      return attch.type === 'image';
    }).map((attch: IImageAttachment) => {
      return {
        src: attch.url,
        caption: attch.caption || this.message.text,
        thumb: attch.url
      }
    });
  }
  getDocumentIconClass(attachment: IDocumentAttachment): string {
    switch (attachment.mime_type){
      case 'application/pdf': return 'fa-file-pdf-o text-danger'
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'fa-file-excel-o text-success'
      case 'application/vnd.ms-excel': return 'fa-file-excel-o text-success'
      case 'application/msexcel': return 'fa-file-excel-o text-success'
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.template': return 'fa-file-excel-o text-success'
      case 'application/msword': return 'fa-file-word-o text-info'
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'fa-file-word-o text-info'
      case 'application/vnd.ms-powerpoint': return 'fa-file-powerpoint-o text-danger'
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return 'fa-file-powerpoint-o text-danger'
      case 'application/vnd.openxmlformats-officedocument.presentationml.slideshow': return 'fa-file-powerpoint-o text-danger'
      case 'text/plain': return 'fa-text-o'
      default: return 'fa-file-o'
    }
  }

  
  openImage(index: number = 0): void {
    console.log("imagen ----");
    this._lightbox.open(this.getImages(), index, { wrapAround: true, showImageNumberLabel: true });
  }
  close(){
    this.nameFile= [];
  }

  rendered(url: string){
    const nameFile = url.split("/")[url.split("/").length-1].replace(/%20/g,"").substring(0,40)
    return nameFile
  }


}
