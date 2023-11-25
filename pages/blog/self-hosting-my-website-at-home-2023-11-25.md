# Self hosting my website at home

![](/Optimized-homelab.jpg)

This website alongside many others services is hosted in the mini pc you see in the picture above, an Intel Alder Lake Ν95 12th Gen (up to 3,4 GHz) with 16GB DDR4 and Ubuntu server 22.04.3 LTS.

It was a long journey to get here, in this post I will try to explain the hardware and main software involved. Let's start answering some basic questions:

### Why self host ?
Because is fun, since I was a kid I was always looking for services to host in my local network for me and my friends. This is how I get into Computer Science in the first place. Nowadays I use to surf the [r/selfhosted](https://www.reddit.com/r/selfhosted/) and youtube for inspiration.
Self-hosting is also an excelent way to learn new things often hidden by cloud providers and you get to know how things work in the system infrastructure and network layer.

### Why a mini PC ?
Because power consumption is very low (around 15W). I wanted something reliable but at the same time I don't want to spend more money in electricity, this server will run 24x7. I also like it small, portable and silent. My plan is to be as cloud-independent and efficient as possible.

### Why Ubuntu server ?
Because is probably the most popular Linux distribution, is very well documented and supported. This is a hobby, I don't want to be stuck for days with some issue not well documented online.  
It was important to me to use the server distro without GUI, I wanted to learn more and feel confortable with the command line.


## Diving into the hardware

### The costs *(september 2023)*
- Router Mikrotik Hex RB750Gr3 5 ports 1gb: &euro; 62.
- Orange Router Livebox 6: &euro; 0 (provided by my ISP).
- Mini PC plus 16GB RAM Kingston 3200mhz (removed the original 8gb) ~ &euro; 195.
- Eaton 3S UPS 700 DIN: &euro; 121 -This is not necessary but I wanted to protect the hardware from any power surge or outage since I'm running some important services like [Home Assistant](https://www.home-assistant.io/).
- Ethernet cables CAT 8 ~ &euro; 6,50 each.
- A domain name ~ &euro; 7 per year.

I have my ISP router connected directly via ethernet cable only with the Mikrotik on the internet port. The Mikrotik is automatically configured to use the ISP router as gateway and is my only DHCP server. The mini PC is connected to the Mikrotik via ethernet cable. For WiFi I use Nest WiFi from Google connected to the Mikrotik via ethernet cable too, this is not necessary but I wanted to have a better WiFi coverage in my house.

<!-- Add picture -->

## Configuring the routers
I want all the traffic and firewall rules to be managed by the Mikrotik, so I have to configure the ISP router to be in bridge mode. This is not possible with the Orange Router Livebox 6, so I have to configure it to be in DMZ mode. This way all the traffic is forwarded to the Mikrotik and the Orange Router Livebox 6 is not doing any firewall or NAT.

### Basic configuration in the Mikrotik
I want to keep this blog simple so I won't go into the details, but I will explain the basic configuration I did in the Mikrotik.
- Assign static IPs to all the devices in my network: This way I can easily manage the firewall rules. You can do this in the DHCP server configuration.  
- Redirecting selected traffic to the Mini PC: You can use [dst-nat](https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/NAT) to redirect internet traffic to your server. For example, I want all the traffic from the port 80/443 to be redirected to my mini PC. This way I can host some websites in the mini PC and access it from the internet. You can do this in the IP > Firewall > NAT tab in the Mikrotik.
- Firewall rules: I want to block all the traffic from the internet to my local network except the traffic I want to allow. You can do this in the IP > Firewall > Filter Rules tab in the Mikrotik.

## Runing services in the mini PC
I wanted to run all my services in containers, this way I can easily manage them and keep the host OS clean.
If one day everything goes wrong I can reinstall the host OS and "easily" restore the containers with `docker-compose`.

### Docker

I use [docker](https://www.docker.com/get-started/) to run all my services in containers.
Currently I only have one `docker-compose.yml` file for all my services including:
- Home Assistant
- Nginx
- Jellyfin
- GoAccess
- Dozzle

## Accessing services from internet
All my services are running in containers in the mini PC, this services (ports) are not exposed outside my local network because the server is only allowed to receive public traffic in ports 80/443.
We need to take some steps to be able to access our services from the internet.

### Setup a domain name
I bought a domain name from namecheap.com, you can buy a domain name from any provider you want.
Next I setup the `DNS records` to point to my public IP address. This way I can access my servics using the domain name instead of the public IP address.
Note: Make sure that your public IP address is static, if not you will need to use a dynamic DNS service also.

### Nginx reverse proxy
[Nginx reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) allows you to forward requests to/from services, it's very well documented and easy to use.
I use it to redirect the public traffic to the proper container in the host using the domain provided.  
For example, for the domain `proderror.eu` I could use the following configuration in my Nginx server:
```
server {
              server_name proderror.eu;
              location / {
                           proxy_pass http://127.0.0.1:3080;
                           proxy_http_version 1.1;
                           proxy_set_header Upgrade $http_upgrade;
                           proxy_set_header Connection 'upgrade';
                           proxy_set_header Host $host;
                           proxy_cache_bypass $http_upgrade;
               }
               ...
        }
```
This way I can access the service running in the port 3080 in the mini PC without exposing the port to the internet.

### Adding HTTPS to your websites
I use [certbot](https://certbot.eff.org/) to add https to my websites. It's very easy to use and it's free.

## Backups
It's very important to version control your configuration files and backup your data. I use the following tools to backup my data:
- I have my `docker-compose` and other scripts in a private repository in github.com.
- I backup configuration files to external drives or google drive.

## Security
This something that I'm still learning and improving. I will write more about this topic in the future.  
For now please make sure that you are NOT exposing your services to the internet without any security measures.

## Monitoring and alerts
Hosting your own services is fun but you need to make sure that everything is working as expected year around.
I use the following tools to monitor my services:
- [GoAccess](https://goaccess.io/) to monitor the traffic in my websites. 
- [Dozzle](https://dozzle.dev/) to monitor the logs of my containers.
- I check the status of my services in the [Home Assistant](https://www.home-assistant.io/) dashboard.
- [betterstack.com](https://betterstack.com/) Uptime monitor for my websites. (FREE tier available)